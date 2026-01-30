import type { Pool } from 'pg'
import type { Logger } from 'winston'
import type { IRooms } from '../app/db/types/rooms.types'
import { DB_TABLE_ROOMS } from '../common/constants/table-db.constant'
import type { TypeAppID } from '../common/types/db/app.interface'
import { responseErrorDB } from '../common/utils/app/errorResponse.utils'
import type { IRoomDto } from './dto/room.dto'
import type { TypeUpdateRoomResult } from './types/admin.interface'

export class AdminModel {
	constructor(private pool: Pool, private logger: Logger) {}

	async createRoom(
		id: string,
		dto: IRoomDto,
		imageUrl: string,
		expireImageUrl: Date | null = null
	): Promise<TypeAppID | null> {
		try {
			const query = `INSERT INTO ${DB_TABLE_ROOMS}
				(id, price, quality, description, status, picture, expire_picture_url)
				VALUES ($1, $2, $3, $4, $5, $6, $7)
				RETURNING id
			`
			const queryResult = await this.pool.query<TypeAppID>(query, [
				id,
				dto.price,
				dto.quality,
				dto.description,
				dto.status,
				imageUrl,
				expireImageUrl,
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
			const query = `SELECT * FROM ${DB_TABLE_ROOMS} 
			ORDER BY created_at DESC 
			LIMIT $1 OFFSET $2`
			const queryResult = await this.pool.query<IRooms>(query, [limit, offset])

			if (queryResult.rowCount === 0) return null

			return queryResult.rows ?? null
		} catch (error) {
			const errorMessage = responseErrorDB(
				this.logger,
				error,
				'Error get-all rooms:'
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
		dto: IRoomDto,
		imageUrl: string | null
	): Promise<TypeAppID | null> {
		try {
			const query = `UPDATE ${DB_TABLE_ROOMS} SET 
				price = COALESCE($1, price),
				quality = COALESCE($2, quality),
				description = COALESCE($3, description),
				status = COALESCE($4, status),
				picture = COALESCE($5, picture)
				WHERE id = $6
				RETURNING id
			`

			const queryResult = await this.pool.query<TypeAppID>(query, [
				dto.price,
				dto.quality,
				dto.description,
				dto.status,
				imageUrl,
				roomId,
			])
			console.log(queryResult)
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

	async updateRoomImage<T extends '*' | 'id'>(
		roomId: string,
		dto: null | string,
		expireImageUrl: Date | null,
		isAll: T
	): Promise<TypeUpdateRoomResult<T> | null> {
		try {
			const query = `UPDATE ${DB_TABLE_ROOMS} 
			SET picture = $1,
				expire_picture_url = $2
			WHERE id = $3
			RETURNING ${isAll}
			`
			const queryResult = await this.pool.query(query, [
				dto,
				expireImageUrl,
				roomId,
			])

			return queryResult.rows[0] ?? null
		} catch (error) {
			const errorMessage = responseErrorDB(
				this.logger,
				error,
				`Error upload-image room: ID-${roomId}`
			)

			return errorMessage
		}
	}

	async removeRoomById(roomId: string): Promise<TypeAppID | null> {
		try {
			const query = `DELETE FROM ${DB_TABLE_ROOMS} WHERE id = $1 RETURNING id`

			const queryResult = await this.pool.query<TypeAppID>(query, [roomId])

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
