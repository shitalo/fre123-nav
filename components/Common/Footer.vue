<template>
	<footer class="site-footer">
		<div class="site-wrap footer-inner">
			<span>
				Powered by
				<a href="https://github.com/fre123-com/fre123-nav" target="_blank" rel="noopener">FRE123</a>
			</span>
			<CommonGithubAssetStatus />
			<div
				v-if="footerRightConfig.is_show && footerRightConfig.list.length > 0"
				class="flex text-[20px] text-black"
			>
				<a v-for="item in footerRightConfig.list" :key="item.url" :href="item.url" target="_blank" rel="noopener" class="pr-6">
					<IconsFontAwesome
						:size="item.icon_size"
						class="hover:text-[#0d6efd]"
						:icon="item.icon_class"
					/>
				</a>
			</div>
		</div>
	</footer>
</template>

<script setup lang="ts">
import { footerRightConfig } from '~/config/website'
</script>

<style scoped>
.site-footer {
	color: var(--site-muted);
	font-size: 13px;
}

.footer-inner {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: space-between;
	min-height: 72px;
	gap: 8px 20px;
	padding-block: 16px;
	padding-inline-end: calc(var(--site-floating-control-size) + 12px);
}

.footer-inner a {
	color: var(--site-accent);
	font-weight: 600;
}

.footer-inner a:hover {
	text-decoration: underline;
}
</style>
