<template>
	<div class="github-asset-status" aria-live="polite">
		<span class="github-asset-status-label">GitHub 节点</span>
		<span v-if="!isHydrated || sourceStatus === 'probing'" class="github-asset-status-loading">
			测速中
		</span>
		<template v-else>
			<span
				v-for="source in fastestSources"
				:key="source.key"
				class="github-asset-source"
				:class="{ current: source.key === preferredSource }"
				:title="source.baseUrl"
			>
				{{ source.label }} {{ source.latency }}ms
			</span>
			<span v-if="fastestSources.length === 0" class="github-asset-status-loading">
				暂无结果
			</span>
		</template>
	</div>
</template>

<script setup lang="ts">
const { preferredSource, sourceStatus } = useGithubAsset()
const { sourceResults } = useGithubAsset()
const isHydrated = ref(false)

const fastestSources = computed(() => {
	return sourceResults.value.filter((source) => source.available).slice(0, 3)
})

onMounted(() => {
	isHydrated.value = true
})
</script>

<style scoped>
.github-asset-status {
	display: flex;
	align-items: center;
	gap: 5px;
	flex-wrap: wrap;
	color: #9ca3af;
	font-size: 11px;
}

.github-asset-status-label {
	color: #6b7280;
}

.github-asset-status-loading {
	background: #facc15;
	color: #854d0e;
	padding: 1px 5px;
	border-radius: 999px;
	animation: github-asset-status-pulse 1.2s ease-in-out infinite;
}

.github-asset-source {
	padding: 1px 5px;
	border: 1px solid transparent;
	border-radius: 999px;
	white-space: nowrap;
}

.github-asset-source.current {
	color: #2563eb;
	border-color: #93c5fd;
	background: #eff6ff;
}

@keyframes github-asset-status-pulse {
	0%,
	100% {
		opacity: 0.45;
	}

	50% {
		opacity: 1;
	}
}
</style>
