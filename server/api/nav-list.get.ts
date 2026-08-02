import navList from '../../config/nav'
import { buildHomeNavList } from '~/utils/static-data-builder'

const homeNavList = buildHomeNavList(navList)

export default defineEventHandler(() => {
	return homeNavList
})
