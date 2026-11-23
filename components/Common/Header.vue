<template>
	<header class="site-header">
		<div id="fre123-header" class="site-wrap header-inner">
			<a class="header-brand" :href="baseConfig.web_host" target="_blank" rel="noopener">
				<span class="header-brand-mark">
					<img :src="getGithubAssetUrl(baseConfig.logo)" width="28" height="28" alt="" />
				</span>
				<span class="header-brand-name">{{ baseConfig.app_name }}</span>
			</a>

			<nav
				v-if="headerRightConfig.is_show && group?.name"
				class="header-links hidden md:flex"
				:aria-label="group.name"
			>
				<a class="header-link" :href="group.url" target="_blank" rel="noopener">
					{{ group.name }}
				</a>
				<ul v-if="group.children?.length" class="header-submenu site-glass-panel">
					<li v-for="item in group.children" :key="item.url">
						<a class="header-link" :href="item.url" target="_blank" rel="noopener">{{ item.name }}</a>
					</li>
				</ul>
			</nav>
		</div>
	</header>
</template>

<script setup lang="ts">
import { baseConfig, headerRightConfig } from '~/config/website'

const { getGithubAssetUrl } = useGithubAsset()
const group = headerRightConfig.group
</script>

<style scoped>
.site-header {
	position: sticky;
	top: 0;
	z-index: 110;
}

.site-header::before {
	position: absolute;
	inset: 0;
	background: var(--site-glass);
	box-shadow: 0 1px 0 rgb(41 56 80 / 7%);
	-webkit-backdrop-filter: var(--site-glass-filter);
	backdrop-filter: var(--site-glass-filter);
	content: '';
	pointer-events: none;
}

.header-inner {
	position: relative;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16px;
	height: var(--site-header-height);
	margin-inline: auto;
}

.header-brand {
	position: relative;
	display: inline-flex;
	align-items: center;
	gap: 10px;
	min-width: 0;
	height: 100%;
	color: var(--site-ink);
	text-decoration: none;
}

.header-brand::after {
	position: absolute;
	bottom: 0;
	left: 0;
	width: 36px;
	height: 2px;
	border-radius: 2px 2px 0 0;
	background: #e5b84d;
	content: '';
}

.header-brand-mark {
	display: grid;
	flex: 0 0 36px;
	place-items: center;
	height: 36px;
	border: 1px solid #f3e6c2;
	border-radius: 13px;
	background: #fff7df;
	box-shadow: inset 0 1px #fffbef;
}

.header-brand-mark img {
	object-fit: contain;
}

.header-brand-name {
	overflow: hidden;
	font-size: 18px;
	font-weight: 700;
	line-height: 1.3;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.header-brand:hover .header-brand-mark {
	background: #ffefc4;
}

.header-links {
	position: relative;
	align-items: center;
	height: 100%;
	white-space: nowrap;
}

.header-link {
	display: block;
	padding: 8px 12px;
	border-radius: 14px;
	color: var(--site-ink);
	font-size: 14px;
	text-decoration: none;
}

.header-link:hover,
.header-link:active {
	background: var(--site-selected);
	color: var(--site-accent);
}

.header-brand:focus-visible,
.header-link:focus-visible {
	outline: 2px solid var(--site-focus);
	outline-offset: -2px;
}

.header-submenu {
	position: absolute;
	top: 100%;
	right: 0;
	display: none;
	min-width: 144px;
	padding: 6px;
}

.header-links:hover .header-submenu,
.header-links:focus-within .header-submenu {
	display: block;
}
</style>
