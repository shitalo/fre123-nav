import { promises as fs } from 'node:fs'
import path from 'node:path'
import { createJiti } from 'jiti'

const PROJECT_ROOT = process.cwd()
const STATIC_DATA_DIR = path.join(PROJECT_ROOT, 'public', 'static-data')
const NAV_LIST_FILE = path.join(STATIC_DATA_DIR, 'nav-list.json')
const jiti = createJiti(import.meta.url, {
	moduleCache: false,
	fsCache: false,
})

const writeJsonFile = async (filePath, content) => {
	await fs.mkdir(path.dirname(filePath), { recursive: true })
	await fs.writeFile(filePath, `${JSON.stringify(content, null, '\t')}\n`, 'utf8')
}

const main = async () => {
	console.log('[static-data] start preparing static data...')
	console.log(`[static-data] output dir: ${path.relative(PROJECT_ROOT, STATIC_DATA_DIR) || '.'}`)

	const navConfigModule = await jiti.import(path.join(PROJECT_ROOT, 'config', 'nav.ts'), {
		default: true,
	})
	const { buildHomeNavList } = await jiti.import(path.join(PROJECT_ROOT, 'utils', 'static-data-builder.ts'))
	const navConfig = navConfigModule?.default ?? navConfigModule

	const homeNavList = buildHomeNavList(navConfig)

	await fs.rm(STATIC_DATA_DIR, {
		recursive: true,
		force: true,
	})

	await writeJsonFile(NAV_LIST_FILE, homeNavList)
	console.log(
		`[static-data] wrote nav list -> ${path.relative(PROJECT_ROOT, NAV_LIST_FILE)} (${homeNavList.length} group(s))`,
	)
}

main().catch((error) => {
	console.error('[static-data] failed to prepare static data:', error)
	process.exitCode = 1
})
