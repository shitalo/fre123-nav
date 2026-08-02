<template>
	<svg
		v-if="resolvedIcon"
		:viewBox="resolvedIcon.viewBox"
		:width="size"
		:height="size"
		aria-hidden="true"
		fill="currentColor"
	>
		<path
			v-for="(pathItem, index) in resolvedIcon.paths"
			:key="`${name}-${index}`"
			:d="pathItem.d"
			:fill="pathItem.fill ?? 'currentColor'"
			:fill-opacity="pathItem.fillOpacity"
		/>
	</svg>
</template>

<script setup lang="ts">
const props = withDefaults(
	defineProps<{
		name: 'uil:search' | 'uil:arrow-circle-right' | 'line-md:loading-twotone-loop'
		size?: number | string
	}>(),
	{
		size: 20,
	},
)

type IconPath = {
	d: string
	fill?: string
	fillOpacity?: string | number
}

type InlineIconDefinition = {
	viewBox: string
	paths: IconPath[]
}

const ICON_MAP: Record<string, InlineIconDefinition> = {
	'uil:search': {
		viewBox: '0 0 24 24',
		paths: [
			{
				d: 'M10.5 3a7.5 7.5 0 1 0 4.72 13.33l4.22 4.23 1.06-1.06-4.23-4.22A7.5 7.5 0 0 0 10.5 3zm0 1.5a6 6 0 1 1 0 12 6 6 0 0 1 0-12z',
			},
		],
	},
	'uil:arrow-circle-right': {
		viewBox: '0 0 24 24',
		paths: [
			{
				d: 'M12 2a10 10 0 1 0 10 10A10.01 10.01 0 0 0 12 2zm0 18.5A8.5 8.5 0 1 1 20.5 12 8.51 8.51 0 0 1 12 20.5zm.53-12.53-1.06 1.06 2.72 2.72H7v1.5h7.19l-2.72 2.72 1.06 1.06L17.06 12z',
			},
		],
	},
	'line-md:loading-twotone-loop': {
		viewBox: '0 0 24 24',
		paths: [
			{
				d: 'M12 3a9 9 0 0 1 8.2 5.3.75.75 0 1 1-1.37.61A7.5 7.5 0 1 0 19.1 14a.75.75 0 0 1 1.48.25A9 9 0 1 1 12 3z',
				fillOpacity: '0.35',
			},
			{
				d: 'M20 4.75V8h-3.25a.75.75 0 0 1 0-1.5h1.44A8.95 8.95 0 0 0 12 3a.75.75 0 0 1 0-1.5 10.45 10.45 0 0 1 7.25 2.92V4.75a.75.75 0 0 1 1.5 0z',
			},
		],
	},
}

const resolvedIcon = computed(() => {
	return ICON_MAP[props.name] ?? null
})
</script>
