import type { Pool } from 'pg'
import type { Logger } from 'winston'
import { DB_TABLE_ROOMS } from '../common/constants/table-db.constant'
import type { IAppCountShared } from '../common/types/app/app.type'
import type { IRooms, TypeRoomId } from '../common/types/db/rooms.types'
import { responseErrorDB } from '../common/utils/app/errorResponse.utils'
import type { RoomDto } from './dto/room.dto'

export class AdminModel {
	constructor(private pool: Pool, private logger: Logger) {}

	async createRoom(
		id: string,
		dto: RoomDto,
		imageUrl: string
	): Promise<TypeRoomId | null> {
		try {
			const query = `INSERT INTO ${DB_TABLE_ROOMS}
				(id, price, quality, description, status, image_url)
				VALUES ($1, $2, $3, $4, $5, $6)
				RETURNING id
			`
			const queryResult = await this.pool.query<TypeRoomId>(query, [
				id,
				dto.price,
				dto.quality,
				dto.description,
				dto.status,
				imageUrl,
			])

			if (!queryResult.rows[0]) return null

			return queryResult.rows[0]
		} catch (error) {
			const errorMessage = responseErrorDB(
				this.logger,
				error,
				'Error create room:'
			)

			return errorMessage
		}
	}

	async getAllRooms(limit: number, offset: number): Promise<IRooms[] | null> {
		try {
			const query = `SELECT * FROM ${DB_TABLE_ROOMS} ORDER BY created_at DESC LIMIT $1 OFFSET $2`
			const queryResult = await this.pool.query<IRooms[]>(query, [
				limit,
				offset,
			])

			if (!queryResult.rows[0]) return null

			return queryResult.rows[0]
		} catch (error) {
			const errorMessage = responseErrorDB(
				this.logger,
				error,
				'Error get-all rooms:'
			)

			return errorMessage
		}
	}

	async getRoomsCount(): Promise<number | null> {
		try {
			const query = `SELECT COUNT(*) FROM ${DB_TABLE_ROOMS}`
			const result = await this.pool.query<IAppCountShared>(query)

			if (!result.rows[0]?.count) return null

			return Number(result.rows[0].count)
		} catch (error) {
			const errorMessage = responseErrorDB(
				this.logger,
				error,
				'Error get-all counts to rooms:'
			)

			return errorMessage
		}
	}

	async getRoomById(roomId: string): Promise<IRooms | null> {
		try {
			const query = `SELECT * FROM ${DB_TABLE_ROOMS} WHERE id = $1`
			const queryResult = await this.pool.query<IRooms>(query, [roomId])

			if (!queryResult.rows[0]) return null

			return queryResult.rows[0]
		} catch (error) {
			const errorMessage = responseErrorDB(
				this.logger,
				error,
				'Error get one room:'
			)

			return errorMessage
		}
	}

	async editRoomById(
		roomId: string,
		dto: RoomDto,
		imageUrl: string | null = null
	): Promise<TypeRoomId | null> {
		try {
			const query = `UPDATE ${DB_TABLE_ROOMS} SET 
				price = COALESCE($1, price),
				quality = COALESCE($2, quality),
				description = COALESCE($3, description),
				status = COALESCE($4, status),
				image_url = COALESCE($5, image_url)
				WHERE id = $6
				RETURNING id
			`

			const queryResult = await this.pool.query<TypeRoomId>(query, [
				dto.price,
				dto.quality,
				dto.description,
				dto.status,
				imageUrl,
				roomId,
			])

			if (!queryResult.rows[0]) return null

			return queryResult.rows[0]
		} catch (error) {
			const errorMessage = responseErrorDB(
				this.logger,
				error,
				`Error edit room: ID-${roomId}`
			)

			return errorMessage
		}
	}

	async updateRoomImage(
		roomId: string,
		dto: string
	): Promise<TypeRoomId | null> {
		try {
			const query = `UPDATE ${DB_TABLE_ROOMS} SET 
			image_url = COALESCE($1, image_url)
			WHERE id = $2
			RETURNING id
			`
			const queryResult = await this.pool.query<TypeRoomId>(query, [
				roomId,
				dto,
			])

			if (!queryResult.rows[0]) return null

			return queryResult.rows[0]
		} catch (error) {
			const errorMessage = responseErrorDB(
				this.logger,
				error,
				`Error upload-image room: ID-${roomId}`
			)

			return errorMessage
		}
	}

	async removeRoomById(roomId: string): Promise<TypeRoomId | null> {
		try {
			const query = `DELETE FROM ${DB_TABLE_ROOMS} WHERE id = $1`

			const queryResult = await this.pool.query<TypeRoomId>(query, [roomId])

			if (!queryResult.rows[0]) return null

			return queryResult.rows[0]
		} catch (error) {
			const errorMessage = responseErrorDB(
				this.logger,
				error,
				`Error remove room: ID-${roomId}`
			)

			return errorMessage
		}
	}
}
