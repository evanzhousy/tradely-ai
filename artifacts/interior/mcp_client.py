import asyncio, os, sys
from pathlib import Path
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
PROMPT='请根据提供的 Zillow 室内照片建模，avatar 能够走进去，室外进入室内采用暗黑破坏神式场景切换。'
async def main():
    p=StdioServerParameters(command='/Users/evansmacbookpro/.local/bin/uvx',args=['blender-mcp==1.9.1'],env={**os.environ,'BLENDER_MCP_DISABLE_TELEMETRY':'true'})
    async with stdio_client(p) as (r,w):
        async with ClientSession(r,w) as s:
            await s.initialize()
            if len(sys.argv)>1:
                result=await s.call_tool('execute_blender_code',{'code':Path(sys.argv[1]).read_text(),'user_prompt':PROMPT})
            else:
                result=await s.call_tool('get_scene_info',{'user_prompt':PROMPT})
            for c in result.content:
                if hasattr(c,'text'): print(c.text)
asyncio.run(main())
