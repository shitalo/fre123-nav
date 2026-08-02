<template>
<footer class="text-left text-[#6c757d] p-6 bg-[rgba(248,249,250,1)] min-h-[70px]">
		<section class="flex justify-center items-center flex-wrap gap-x-4 gap-y-2">
			<!-- Left -->
			<div class="flex items-center flex-wrap gap-x-3 gap-y-1 text-[14px]">
				<span
					>Powered by
					<a
						href=""
						target="_blank"
						class="decoration-transparent text-[#a4715c]"
						>FRE123</a
					>
				</span>
				<CommonGithubAssetStatus />
			</div>
			<!-- Left -->

			<div v-if="footerRightConfig.is_show" class="flex-grow"></div>
			<!-- Right -->
			<div
				v-if="footerRightConfig.is_show && footerRightConfig.list.length > 0"
				class="flex text-[20px] text-black"
			>
				<a v-for="item in footerRightConfig.list" :href="item.url" target="_blank" class="pr-6">
					<IconsFontAwesome
						:size="item.icon_size"
						class="hover:text-[#0d6efd]"
						:icon="item.icon_class"
					/>
				</a>
			</div>
		</section>
	</footer>
</template>

<script setup lang="ts">
import { footerRightConfig } from '~/config/website'
</script>

<style scoped></style>
