<template>
	<NuxtLayout name="default">
		<section class="error-page" aria-labelledby="error-title">
			<p v-if="notFound" class="error-code">404</p>
			<h1 id="error-title">{{ notFound ? '找不到这个页面' : '页面暂时无法打开' }}</h1>
			<p v-if="notFound" class="error-description">这个链接可能已失效。</p>
			<a class="error-home" :href="resolveAppAssetPath('/')">返回首页</a>
		</section>
	</NuxtLayout>
</template>

<script setup lang="ts">
import type { NuxtError } from '#app'
import { seoConfig } from '~/config/website'

const props = defineProps<{ error: NuxtError }>()
const { resolveAppAssetPath } = useAppAssetPath()
const notFound = computed(() => props.error.statusCode === 404)

useHead({
	title: () => `${notFound.value ? '找不到这个页面' : '页面暂时无法打开'} - ${seoConfig.title}`,
	htmlAttrs: { lang: 'zh-CN' },
})
</script>

<style scoped>
.error-page {
	display: grid;
	justify-items: start;
	align-content: center;
	gap: 12px;
	width: min(100%, 544px);
	min-height: min(64vh, 540px);
	margin-inline: auto;
	padding: 48px clamp(8px, 4vw, 56px);
}

.error-code {
	color: var(--site-accent);
	font-size: 14px;
	font-weight: 600;
}

.error-page h1 {
	font-size: clamp(26px, 5vw, 38px);
	font-weight: 700;
	line-height: 1.25;
}

.error-description {
	color: var(--site-muted);
}

.error-home {
	display: inline-flex;
	align-items: center;
	min-height: 44px;
	margin-top: 8px;
	padding: 8px 20px;
	border: 1px solid var(--site-glass-edge);
	border-radius: 999px;
	background: var(--site-surface);
	color: var(--site-accent);
	font-weight: 600;
	box-shadow: var(--site-glass-shadow);
}

.error-home:hover,
.error-home:active {
	background: var(--site-selected);
}

.error-home:focus-visible {
	outline: 2px solid var(--site-focus);
	outline-offset: 2px;
}

@media (prefers-reduced-motion: no-preference) {
	.error-home {
		transition: background-color var(--site-transition);
	}
}
</style>
