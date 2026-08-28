import { createHash } from "node:crypto";
import { createReadStream, existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import {
	HeadObjectCommand,
	PutObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3";
import dotenv from "dotenv";

const projectRoot = resolve(import.meta.dirname, "../../..");
const manifestPath = resolve(projectRoot, "scripts/media-manifest.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const env = dotenv.parse(
	readFileSync(resolve(projectRoot, "apps/web/.env"), "utf8"),
);
const args = new Set(process.argv.slice(2));
const shouldUpload = args.has("--upload");
const shouldVerify = shouldUpload || args.has("--verify");

function fail(message) {
	throw new Error(message);
}

function localPath(source) {
	return resolve(projectRoot, source);
}

async function md5(filePath) {
	const hash = createHash("md5");
	for await (const chunk of createReadStream(filePath)) hash.update(chunk);
	return hash.digest("hex");
}

function validateManifest() {
	if (!manifest.bucket || !Array.isArray(manifest.assets)) {
		fail("media-manifest.json must define bucket and assets");
	}
	const keys = new Set();
	for (const asset of manifest.assets) {
		for (const field of [
			"id",
			"source",
			"key",
			"contentType",
			"cacheControl",
			"visibility",
		]) {
			if (!asset[field]) fail(`${asset.id ?? "unknown"} is missing ${field}`);
		}
		if (asset.visibility !== "private") {
			fail(`${asset.id} is not private; paid/concept media cannot be public`);
		}
		if (
			!asset.key.startsWith("tradingflow-foundations/") &&
			!asset.key.startsWith("tradingflow-concepts/")
		) {
			fail(`${asset.id} has an unowned R2 key: ${asset.key}`);
		}
		if (asset.source.includes("tradingflow-web-landingpage")) {
			fail(`${asset.id} still imports from the Landing repository`);
		}
		if (asset.source.startsWith("apps/web/public/")) {
			fail(`${asset.id} places private media under apps/web/public`);
		}
		if (keys.has(asset.key)) fail(`duplicate R2 key: ${asset.key}`);
		keys.add(asset.key);
		const sourcePath = localPath(asset.source);
		if (!existsSync(sourcePath))
			fail(`${asset.id} source is missing: ${sourcePath}`);
	}
}

function client() {
	for (const field of [
		"MEDIA_S3_BUCKET",
		"MEDIA_S3_ENDPOINT",
		"MEDIA_S3_REGION",
		"MEDIA_S3_ACCESS_KEY_ID",
		"MEDIA_S3_SECRET_ACCESS_KEY",
	]) {
		if (!env[field]) fail(`Missing ${field} in apps/web/.env`);
	}
	return new S3Client({
		region: env.MEDIA_S3_REGION,
		endpoint: env.MEDIA_S3_ENDPOINT,
		forcePathStyle: true,
		credentials: {
			accessKeyId: env.MEDIA_S3_ACCESS_KEY_ID,
			secretAccessKey: env.MEDIA_S3_SECRET_ACCESS_KEY,
		},
	});
}

async function verifyRemote(s3, asset, size, checksum) {
	const remote = await s3.send(
		new HeadObjectCommand({ Bucket: manifest.bucket, Key: asset.key }),
	);
	if (remote.ContentLength !== size) {
		fail(
			`${asset.id} size mismatch: local ${size}, remote ${remote.ContentLength}`,
		);
	}
	if (remote.CacheControl !== asset.cacheControl) {
		fail(
			`${asset.id} cache policy mismatch: expected ${asset.cacheControl}, remote ${remote.CacheControl}`,
		);
	}
	if (
		remote.Metadata?.owner !== "tradely" ||
		remote.Metadata?.visibility !== "private"
	) {
		fail(`${asset.id} is not marked as private Tradely media`);
	}
	const remoteEtag = remote.ETag?.replaceAll('"', "");
	if (
		remoteEtag &&
		/^[a-f0-9]{32}$/i.test(remoteEtag) &&
		remoteEtag !== checksum
	) {
		fail(
			`${asset.id} checksum mismatch: local ${checksum}, remote ${remoteEtag}`,
		);
	}
	return { size, checksum, etag: remoteEtag ?? null };
}

async function main() {
	validateManifest();
	const s3 = shouldVerify ? client() : null;
	const results = [];
	for (const asset of manifest.assets) {
		const filePath = localPath(asset.source);
		const size = statSync(filePath).size;
		const checksum = await md5(filePath);
		if (shouldUpload) {
			await s3.send(
				new PutObjectCommand({
					Bucket: manifest.bucket,
					Key: asset.key,
					Body: createReadStream(filePath),
					ContentType: asset.contentType,
					CacheControl: asset.cacheControl,
					Metadata: { owner: "tradely", visibility: "private", md5: checksum },
				}),
			);
		}
		const remote = shouldVerify
			? await verifyRemote(s3, asset, size, checksum)
			: null;
		results.push({ id: asset.id, key: asset.key, size, checksum, remote });
	}
	console.log(
		JSON.stringify(
			{
				mode: shouldUpload
					? "uploaded-and-verified"
					: shouldVerify
						? "verified"
						: "dry-run",
				bucket: manifest.bucket,
				assets: results.length,
				results,
			},
			null,
			2,
		),
	);
}

main().catch((error) => {
	console.error(error instanceof Error ? error.message : error);
	process.exitCode = 1;
});
