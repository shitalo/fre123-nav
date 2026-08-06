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
		name: 'uil:search' | 'uil:arrow-circle-right' | 'uil:globe' | 'line-md:loading-twotone-loop'
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
	'uil:globe': {
		viewBox: '0 0 24 24',
		paths: [
			{
				d: 'M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2m7.93 9h-3.01a15.7 15.7 0 0 0-1.18-5.07A8.03 8.03 0 0 1 19.93 11M12 4c1.17 1.39 2.02 3.17 2.44 5H9.56C9.98 7.17 10.83 5.39 12 4M8.26 5.93A15.7 15.7 0 0 0 7.08 11H4.07a8.03 8.03 0 0 1 4.19-5.07M4.07 13h3.01a15.7 15.7 0 0 0 1.18 5.07A8.03 8.03 0 0 1 4.07 13m4.19 5.07A15.7 15.7 0 0 0 9.44 13h5.12a15.7 15.7 0 0 0 1.18 5.07A8.03 8.03 0 0 1 8.26 18.07M12 20c-1.17-1.39-2.02-3.17-2.44-5h4.88c-.42 1.83-1.27 3.61-2.44 5m3.74-1.93A15.7 15.7 0 0 0 16.92 13h3.01a8.03 8.03 0 0 1-4.19 5.07M16.92 11a15.7 15.7 0 0 0-1.18-5.07A8.03 8.03 0 0 1 19.93 11z',
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
