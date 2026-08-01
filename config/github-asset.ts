export type GithubAssetStrategy = 'jsdelivr' | 'prefix'

export type GithubAssetSource = {
	key: string
	label: string
	strategy: GithubAssetStrategy
	baseUrl: string
}

export const DEFAULT_GITHUB_ASSET_SOURCE = 'javajun'

export const GITHUB_ASSET_PROBE_URL =
	'https://raw.githubusercontent.com/jquery/jquery/main/package.json'

export const GITHUB_ASSET_SOURCE_LIST = [
	// {
	// 	key: 'fastly',
	// 	label: 'Fastly',
	// 	strategy: 'jsdelivr',
	// 	baseUrl: 'https://fastly.jsdelivr.net',
	// },
	// {
	// 	key: 'gcore',
	// 	label: 'Gcore',
	// 	strategy: 'jsdelivr',
	// 	baseUrl: 'https://gcore.jsdelivr.net',
	// },
	// {
	// 	key: 'testingcf',
	// 	label: 'testingcf',
	// 	strategy: 'jsdelivr',
	// 	baseUrl: 'https://testingcf.jsdelivr.net',
	// },
	{
		key: 'ghfast',
		label: 'ghfast',
		strategy: 'prefix',
		baseUrl: 'https://ghfast.top',
	},
	{
		key: 'javajun',
		label: 'javajun',
		strategy: 'prefix',
		baseUrl: 'https://github.proxy.javajun.com',
	},
	{
		key: 'b52m',
		label: 'b52m',
		strategy: 'prefix',
		baseUrl: 'https://gh.b52m.cn',
	},
] as const satisfies readonly GithubAssetSource[]

export type GithubAssetSourceKey = (typeof GITHUB_ASSET_SOURCE_LIST)[number]['key']
