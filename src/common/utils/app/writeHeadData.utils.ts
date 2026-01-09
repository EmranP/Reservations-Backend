export const writeHeadData = (status: number) => ({
	status,
	contentData: { 'Content-Type': 'application/json' },
	contentFile: { 'Content-Type': '' },
})
