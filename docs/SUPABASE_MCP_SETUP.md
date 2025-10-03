# Supabase MCP Configuration Guide

## Your Correct Project
**Project ID:** `vlnnvxlgzhtaorpixsay`

## Step 1: Get Your Supabase Access Token

1. Go to: https://supabase.com/dashboard/account/tokens
2. Click "Generate New Token"
3. Give it a name like "MCP Access"
4. Copy the token (you'll only see it once!)

## Step 2: Configure MCP in Cursor

### Option A: Through Cursor Settings UI

1. Open Cursor
2. Go to Settings (Cmd + ,)
3. Search for "MCP"
4. Add/Update Supabase MCP Server configuration:

```json
{
  "supabase": {
    "command": "npx",
    "args": ["-y", "@supabase/mcp-server"],
    "env": {
      "SUPABASE_ACCESS_TOKEN": "<YOUR_TOKEN_HERE>",
      "SUPABASE_PROJECT_REF": "vlnnvxlgzhtaorpixsay"
    }
  }
}
```

### Option B: Environment Variables

Add to your shell profile (`~/.zshrc` or `~/.bashrc`):

```bash
export SUPABASE_ACCESS_TOKEN="your_token_here"
export SUPABASE_PROJECT_REF="vlnnvxlgzhtaorpixsay"
```

Then restart Cursor.

## Step 3: Verify Connection

After configuration, you can verify by asking Claude to:
- List your Supabase projects (should show vlnnvxlgzhtaorpixsay)
- Access the correct project

## Step 4: Deploy NYC Schema

Once configured correctly, Claude can deploy the NYC schema to the right project using:

```
mcp_supabase_apply_migration for project vlnnvxlgzhtaorpixsay
```

---

## Troubleshooting

If you still see the wrong project:
1. Make sure you **restarted Cursor** after changing config
2. Verify the token has access to project `vlnnvxlgzhtaorpixsay`
3. Check token hasn't expired

## Alternative: Manual SQL Deployment

If MCP configuration is difficult, you can deploy manually:

1. Open: https://supabase.com/dashboard/project/vlnnvxlgzhtaorpixsay/sql/new
2. Copy contents of: `database/nyc_schema.sql`
3. Paste and run in SQL Editor

---

**Once configured, let me know and I'll re-deploy to the correct project!**

