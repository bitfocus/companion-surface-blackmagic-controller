import {
	CardGenerator,
	HostCapabilities,
	SurfaceDrawProps,
	SurfaceContext,
	SurfaceInstance,
	parseColor,
	ModuleLogger,
	createModuleLogger,
	assertNever,
} from '@companion-surface/base'
import {
	BlackmagicController,
	BlackmagicControllerButtonControlDefinition,
	BlackmagicControllerModelId,
	BlackmagicControllerSetButtonSomeValue,
	BlackmagicControllerTBarControlDefinition,
} from '@blackmagic-controller/node'
import debounceFn from 'debounce-fn'

export class BlackmagicControllerWrapper implements SurfaceInstance {
	readonly #logger: ModuleLogger

	readonly #device: BlackmagicController
	readonly #surfaceId: string
	// readonly #context: SurfaceContext

	public get surfaceId(): string {
		return this.#surfaceId
	}
	public get productName(): string {
		return this.#device.PRODUCT_NAME
	}

	public constructor(surfaceId: string, deck: BlackmagicController, context: SurfaceContext) {
		this.#logger = createModuleLogger(`Blackmagic/${surfaceId}`)
		this.#device = deck
		this.#surfaceId = surfaceId
		// this.#context = context

		this.#device.on('error', (e) => context.disconnect(e as any))

		this.#device.on('down', (control) => {
			context.keyDownById(control.id)
		})
		this.#device.on('up', (control) => {
			context.keyUpById(control.id)
		})
		this.#device.on('batteryLevel', (_level) => {
			// context.sendVariableValue(this.#surfaceId, 'batteryLevel', level.toString())
		})
		this.#device.on('tbar', (_control, level) => {
			context.sendVariableValue('tbarValueVariable', level.toString())
		})
		this.#device.on('jog', (_control, _delta) => {
			// context.sendVariableValue('jogDeltaVariable', delta.toString())
		})
	}

	async init(): Promise<void> {
		// Start with blanking it
		await this.blank()
	}
	async close(): Promise<void> {
		await this.#device.clearPanel().catch(() => null)

		await this.#device.close()
	}

	updateCapabilities(_capabilities: HostCapabilities): void {
		// Not used
	}

	async ready(): Promise<void> {}

	async setBrightness(_percent: number): Promise<void> {
		// Not supported
	}
	async blank(): Promise<void> {
		await this.#device.clearPanel()
	}
	async draw(_signal: AbortSignal, drawProps: SurfaceDrawProps): Promise<void> {
		if (!drawProps.color) drawProps.color = '#000000'

		const control = this.#device.CONTROLS.find(
			(control): control is BlackmagicControllerButtonControlDefinition =>
				control.type === 'button' && control.id === drawProps.controlId,
		)
		if (!control) return

		this.#pendingDrawColors[control.id] = { color: drawProps.color, control }

		this.#triggerRedraw()
	}

	onVariableValue(name: string, value: string): void {
		if (name === 'tbarLeds') {
			const tbarControl = this.#device.CONTROLS.find(
				(control): control is BlackmagicControllerTBarControlDefinition => control.type === 'tbar' && control.id === 0,
			)
			if (!tbarControl) {
				this.#logger.error(`T-bar control not found`)
				return
			}

			const ledValues = new Array(tbarControl.ledSegments).fill(false)
			const fillLedCount = Number(value)
			if (isNaN(fillLedCount)) {
				return // Future: allow patterns
			}

			if (fillLedCount > 0) {
				ledValues.fill(true, Math.max(ledValues.length - fillLedCount, 0))
			} else if (fillLedCount < 0) {
				ledValues.fill(true, 0, Math.min(-fillLedCount, ledValues.length))
			}

			this.#device.setTbarLeds(ledValues).catch((e) => {
				this.#logger.error(`write failed: ${e}`)
			})
		} else {
			this.#logger.error(`Unknown variable: ${name}`)
		}
	}

	onLockedStatus(locked: boolean, characterCount: number): void {
		if (locked && this.#device.MODEL === BlackmagicControllerModelId.AtemMicroPanel) {
			// Show a progress bar on the upper row to indicate number of characters entered

			const lockOutputKeyIds = [
				// Note: these are in order of value they represent
				'program1',
				'program2',
				'program3',
				'program4',
				'program5',
				'program6',
				'program7',
				'program8',
				'program9',
				'program10',
			]

			const controlMap = new Map(
				this.#device.CONTROLS.filter((c) => c.type === 'button').map((control) => [control.id, control]),
			)

			const colors: BlackmagicControllerSetButtonSomeValue[] = []

			for (let i = 0; i < characterCount && i < lockOutputKeyIds.length; i++) {
				const control = controlMap.get(lockOutputKeyIds[i])
				if (!control) continue

				switch (control.feedbackType) {
					case 'rgb':
						colors.push({
							type: 'rgb',
							keyId: lockOutputKeyIds[i],
							red: true,
							green: true,
							blue: true,
						})
						break
					case 'on-off':
						colors.push({
							type: 'on-off',
							keyId: lockOutputKeyIds[i],
							on: true,
						})
						break
					case 'none':
						// no-op
						break
					default:
						assertNever(control.feedbackType)
						break
				}
			}

			this.#device.setButtonStates(colors).catch((e) => {
				this.#logger.error(`write failed: ${e}`)
			})
		}
	}

	async showStatus(_signal: AbortSignal, _cardGenerator: CardGenerator): Promise<void> {
		// Nothing to display here
		// TODO - do some flashing lights to indicate each status?
	}

	/**
	 * Trigger a redraw of this control, if it can be drawn
	 * @access protected
	 */
	#triggerRedraw = debounceFn(
		() => {
			const colors: BlackmagicControllerSetButtonSomeValue[] = []

			const threshold = 100 // Use a lower than 50% threshold, to make it more sensitive

			for (const [id, { color: rawColor, control }] of Object.entries(this.#pendingDrawColors)) {
				const color = parseColor(rawColor)
				const red = color.r >= threshold
				const green = color.g >= threshold
				const blue = color.b >= threshold

				switch (control.feedbackType) {
					case 'rgb':
						colors.push({
							keyId: id,
							type: 'rgb',
							red: color.r >= threshold,
							green: color.g >= threshold,
							blue: color.b >= threshold,
						})
						break
					case 'on-off':
						colors.push({
							keyId: id,
							type: 'on-off',
							on: red || green || blue,
						})
						break
					case 'none':
						// no-op
						break
					default:
						assertNever(control.feedbackType)
						break
				}
			}

			if (colors.length === 0) return

			this.#pendingDrawColors = {}
			this.#device.setButtonStates(colors).catch((e) => {
				this.#logger.error(`write failed: ${e}`)
			})
		},
		{
			before: false,
			after: true,
			wait: 5,
			maxWait: 20,
		},
	)
	#pendingDrawColors: Record<string, { color: string; control: BlackmagicControllerButtonControlDefinition }> = {}
}
