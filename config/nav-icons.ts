import type AppIcon from '~/components/Icons/AppIcon.vue'

type IconName = InstanceType<typeof AppIcon>['$props']['name']

const navGroupIcons = new Map<string, IconName>([
	['影视资源', 'film'],
	['网盘资源', 'cloud'],
	['工具资源', 'wrench'],
	['生活资源', 'house'],
	['书籍资源', 'book-open'],
	['软件工具', 'app-window'],
	['优质音频', 'headphones'],
	['图片壁纸', 'image'],
])

export const getNavGroupIcon = (groupName: string): IconName => navGroupIcons.get(groupName) ?? 'folder'
