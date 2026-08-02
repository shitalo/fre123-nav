const SETTINGS_STORAGE_KEY = 'customize_setting'

type PersistedSettingsState = {
	curEngine?: string
}

const readPersistedSettingsState = (): PersistedSettingsState | null => {
	if (!import.meta.client) {
		return null
	}

	try {
		const rawState = window.localStorage.getItem(SETTINGS_STORAGE_KEY)
		if (!rawState) {
			return null
		}

		const parsedState = JSON.parse(rawState) as PersistedSettingsState
		return parsedState && typeof parsedState === 'object' ? parsedState : null
	} catch {
		return null
	}
}

const writePersistedSettingsState = (state: PersistedSettingsState) => {
	if (!import.meta.client) {
		return
	}

	window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(state))
}

const useSettingStore = defineStore('customize_setting', () => {
	const curEngine = ref<string>()
	const hasHydratedFromStorage = ref(false)

	const persistState = () => {
		if (!import.meta.client || !hasHydratedFromStorage.value) {
			return
		}

		writePersistedSettingsState({
			curEngine: curEngine.value,
		})
	}

	const hydrateFromStorage = () => {
		if (!import.meta.client || hasHydratedFromStorage.value) {
			return
		}

		const persistedState = readPersistedSettingsState()
		if (typeof persistedState?.curEngine === 'string' && persistedState.curEngine) {
			curEngine.value = persistedState.curEngine
		}

		hasHydratedFromStorage.value = true
		persistState()
	}

	const switchEngine = (val: string) => {
		curEngine.value = val
		persistState()
	}

	return {
		curEngine,
		hasHydratedFromStorage,
		hydrateFromStorage,
		switchEngine,
	}
})

export default useSettingStore
