<template>
	<NuxtLayout>
		<NuxtPage />
	</NuxtLayout>
</template>

<script setup lang="ts">
import { seoConfig } from './config/website'
const { resolveAppAssetPath } = useAppAssetPath()
// 初始化 SEO_TITLE 模板和主题
useHead({
	titleTemplate: (s) => {
		return s ? `${s} - ${seoConfig.title}` : `${seoConfig.title}`
	},
	link: [
		{
			rel: 'icon',
			type: 'image/x-icon',
			href: resolveAppAssetPath(seoConfig.icon),
		},
	],
	meta: [
		{
			name: 'keywords',
			content: seoConfig.keywords,
		},
		{
			name: 'description',
			content: seoConfig.description,
		},
	],
	bodyAttrs: {
		class: 'bg-base',
	},
})
</script>
