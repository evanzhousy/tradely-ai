import { toast as heroToast, Toast } from "@heroui/react/toast";

const toast = {
	...heroToast,
	error: heroToast.danger,
};

export { Toast, toast };
