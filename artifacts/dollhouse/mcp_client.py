import asyncio, os, sys
from pathlib import Path
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

async def main():
    params=StdioServerParameters(command='/Users/evansmacbookpro/.local/bin/uvx',args=['blender-mcp==1.9.1'],env={**os.environ,'BLENDER_MCP_DISABLE_TELEMETRY':'true'})
    async with stdio_client(params) as (read,write):
        async with ClientSession(read,write) as session:
            await session.initialize()
            result=await session.call_tool('execute_blender_code',{'code':Path(sys.argv[1]).read_text(),'user_prompt':'增加一个与附件相同的 Barbie house，所有资产先在 Blender 建模。'})
            for content in result.content:
                if hasattr(content,'text'):print(content.text)
asyncio.run(main())
