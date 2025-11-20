import type { IncomingMessage, ServerResponse } from 'http'
import type { Logger } from 'winston'
import type { EmailService } from './email.service'

export class EmailController {
	// ! Add checking for expires verify
	constructor(private emailService: EmailService, private logger: Logger) {}

	async getLink(
		req: IncomingMessage,
		res: ServerResponse<IncomingMessage>,
		link: string | null
	) {
		try {
		} catch (error) {}
	}
}
