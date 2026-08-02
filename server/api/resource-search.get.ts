import resourceConfig from '../../config/resource'
import type { IResourceSearchPayload } from '~/interface/resource'
import { buildResourceSearchPayload } from '~/utils/static-data-builder'

export default defineEventHandler((event): IResourceSearchPayload => {
	const query = getQuery(event)
	const requestedResourceType =
		typeof query.type === 'string' && query.type.length > 0 ? query.type : undefined

	return buildResourceSearchPayload(resourceConfig, requestedResourceType)
})
