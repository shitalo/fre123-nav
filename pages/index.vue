<template>
	<!-- 首页顶部搜索 -->
	<div ref="container">
		<CommonNavBar :nav-list="navList || []" />
		<!-- 这里是导航列表 -->
		<div id="nav-container" class="lg:ml-[210px]">
			<IndexNavGroup
				v-for="(nav, i) in navList || []"
				:key="nav.group_name"
				:idx="i"
				:groupData="nav"
			></IndexNavGroup>
		</div>
	</div>
</template>
<script setup lang="ts">
const { getNavListStaticDataUrl } = useStaticDataPath()

const loadNavList = async () => {
	if (import.meta.server) {
		const [{ default: navConfig }, { buildHomeNavList }] = await Promise.all([
			import('~/config/nav'),
			import('~/utils/static-data-builder'),
		])
		return buildHomeNavList(navConfig)
	}

	const response = await fetch(getNavListStaticDataUrl(), {
		headers: {
			accept: 'application/json',
		},
	})

	if (!response.ok) {
		throw createError({
			statusCode: response.status,
			statusMessage: `Failed to load nav list: ${response.statusText}`,
		})
	}

	return await response.json()
}

const { data: navList } = await useAsyncData('static-nav-list', loadNavList, {
	default: () => [],
})
</script>
<style></style>
