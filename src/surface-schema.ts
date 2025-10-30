import { BlackmagicControllerModelId, type BlackmagicController } from '@blackmagic-controller/node'
import {
	assertNever,
	type SurfaceInputVariable,
	type SurfaceOutputVariable,
	type SurfaceSchemaLayoutDefinition,
} from '@companion-surface/base'

export function createSurfaceSchema(controller: BlackmagicController): SurfaceSchemaLayoutDefinition {
	const surfaceLayout: SurfaceSchemaLayoutDefinition = {
		stylePresets: {
			default: {
				colors: 'hex',
			},
		},
		controls: {},
	}

	for (const control of controller.CONTROLS) {
		surfaceLayout.controls[control.id] = {
			row: control.row,
			column: control.column,
		}
	}

	return surfaceLayout
}

export function createTransferVariables(
	model: BlackmagicControllerModelId,
): Array<SurfaceInputVariable | SurfaceOutputVariable> {
	switch (model) {
		case BlackmagicControllerModelId.AtemMicroPanel:
			return [
				{
					id: 'tbarValueVariable',
					type: 'input',
					name: 'Variable to store T-bar value to',
					description:
						'This produces a value between 0 and 1. You can use an expression to convert it into a different range.',
				},
				{
					id: 'tbarLeds',
					type: 'output',
					name: 'T-bar LED pattern',
					description:
						'Set the pattern of LEDs on the T-bar. Use numbers -16 to 16, positive numbers light up from the bottom, negative from the top.',
				},
			]
		case BlackmagicControllerModelId.DaVinciResolveSpeedEditor:
			return [
				// TODO
			]
		case BlackmagicControllerModelId.DaVinciResolveReplayEditor:
			return [
				// TODO
			]
		default:
			assertNever(model)
			return []
	}
}
