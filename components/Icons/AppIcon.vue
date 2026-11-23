<template>
	<svg
		v-if="resolvedIcon"
		:viewBox="resolvedIcon.viewBox"
		:width="size"
		:height="size"
		aria-hidden="true"
		:fill="resolvedIcon.strokeWidth ? 'none' : 'currentColor'"
		:stroke="resolvedIcon.strokeWidth ? 'currentColor' : undefined"
		:stroke-width="resolvedIcon.strokeWidth"
		stroke-linecap="round"
		stroke-linejoin="round"
	>
		<path
			v-for="(pathItem, index) in resolvedIcon.paths"
			:key="`${name}-${index}`"
			:d="pathItem.d"
			:fill="pathItem.fill"
			:fill-opacity="pathItem.fillOpacity"
		/>
	</svg>
</template>

<script setup lang="ts">
const props = withDefaults(
	defineProps<{
		name: keyof typeof ICON_MAP
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
	strokeWidth?: number
}

const ICON_MAP = {
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
	film: {
		viewBox: '0 0 24 24',
		strokeWidth: 1.7,
		paths: [{ d: 'M5 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Zm5 4 5 3-5 3Z' }],
	},
	cloud: {
		viewBox: '0 0 24 24',
		strokeWidth: 1.7,
		paths: [{ d: 'M7 18a4.5 4.5 0 1 1 .9-8.91 5.5 5.5 0 0 1 10.5 1.42A3.75 3.75 0 0 1 18.25 18Z' }],
	},
	wrench: {
		viewBox: '0 0 24 24',
		strokeWidth: 1.7,
		paths: [{ d: 'M15.4 4.1a5.2 5.2 0 0 0-5.8 7.1L4 16.8a2.3 2.3 0 1 0 3.3 3.3l5.6-5.6a5.2 5.2 0 0 0 7.1-5.8l-3 3-3.5-.9-.9-3.5 3-3.2Z' }],
	},
	house: {
		viewBox: '0 0 24 24',
		strokeWidth: 1.7,
		paths: [{ d: 'm3.5 11 8.5-7 8.5 7M6 10v9a1 1 0 0 0 1 1h3v-5h4v5h3a1 1 0 0 0 1-1v-9' }],
	},
	'book-open': {
		viewBox: '0 0 24 24',
		strokeWidth: 1.7,
		paths: [{ d: 'M12 7c-2-2-5-2.5-9-2v13c4-.5 7 0 9 2 2-2 5-2.5 9-2V5c-4-.5-7 0-9 2Zm0 0v13' }],
	},
	'app-window': {
		viewBox: '0 0 24 24',
		strokeWidth: 1.7,
		paths: [{ d: 'M5 4.5h14a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-11a2 2 0 0 1 2-2ZM3 9h18m-14-2.2h.01m3 0h.01' }],
	},
	headphones: {
		viewBox: '0 0 24 24',
		strokeWidth: 1.7,
		paths: [{ d: 'M4 13v-1a8 8 0 0 1 16 0v1M4 13h2.5A1.5 1.5 0 0 1 8 14.5v4A1.5 1.5 0 0 1 6.5 20H6a2 2 0 0 1-2-2v-5Zm16 0h-2.5a1.5 1.5 0 0 0-1.5 1.5v4a1.5 1.5 0 0 0 1.5 1.5h.5a2 2 0 0 0 2-2v-5Z' }],
	},
	image: {
		viewBox: '0 0 24 24',
		strokeWidth: 1.7,
		paths: [{ d: 'M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm-2 12 5-5 4 4 3.5-3.5L21 17M16 8h.01' }],
	},
	folder: {
		viewBox: '0 0 24 24',
		strokeWidth: 1.7,
		paths: [{ d: 'M5 5h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z' }],
	},
} satisfies Record<string, InlineIconDefinition>

const resolvedIcon = computed<InlineIconDefinition | null>(() => {
	return ICON_MAP[props.name] ?? null
})
</script>
