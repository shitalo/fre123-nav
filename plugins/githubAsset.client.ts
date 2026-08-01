export default defineNuxtPlugin((nuxtApp) => {
	const { initGithubAssetSource } = useGithubAsset()

	nuxtApp.hook('app:mounted', () => {
		initGithubAssetSource()
	})
})
