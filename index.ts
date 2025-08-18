import { createCanvas } from 'canvas'
import { writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { input } from '@inquirer/prompts'

type DataType = {
	firstPerson: {
		name: string
		previousUnit: number
		currentUnit: number
	}
	secondPerson: {
		name: string
		previousUnit: number
		currentUnit: number
	}
	totalMoney: number
}

function onlyTwoDigits(num: number): number {
	return Number(num.toFixed(2))
}

function generateImage(lines: string[], filename: string) {
	// Create canvas with appropriate size
	const lineHeight = 80
	const padding = 100
	const width = 1080
	const height = lines.length * lineHeight + padding * 2

	const canvas = createCanvas(width, height)
	const ctx = canvas.getContext('2d')

	// Set background color
	ctx.fillStyle = '#ffffff'
	ctx.fillRect(0, 0, width, height)

	// Set text properties
	ctx.fillStyle = '#000000'
	ctx.font = '32px Arial'

	// Draw each line
	lines.forEach((line, index) => {
		const y = padding + index * lineHeight + 20
		ctx.fillText(line, padding, y)
	})

	// Save the image
	const buffer = canvas.toBuffer('image/jpeg')
	const fullFileName = `${encodeURIComponent(filename)}_${Date.now()}.jpg`
	writeFileSync(join(dirname(fileURLToPath(import.meta.url)), fullFileName), buffer)
	console.log('Image generated successfully! Saved as:', fullFileName)
}

function calculate(data: DataType) {
	data.firstPerson.previousUnit = onlyTwoDigits(data.firstPerson.previousUnit)
	data.firstPerson.currentUnit = onlyTwoDigits(data.firstPerson.currentUnit)
	data.secondPerson.previousUnit = onlyTwoDigits(data.secondPerson.previousUnit)
	data.secondPerson.currentUnit = onlyTwoDigits(data.secondPerson.currentUnit)
	data.totalMoney = onlyTwoDigits(data.totalMoney)

	const lines: string[] = []
	const filename = `${data.firstPerson.name}_${data.secondPerson.name}`

	const firstPersonUnitUsed = onlyTwoDigits(data.firstPerson.currentUnit - data.firstPerson.previousUnit)
	lines.push(`${data.firstPerson.name} used: ${data.firstPerson.currentUnit}-${data.firstPerson.previousUnit} = ${firstPersonUnitUsed} unit`)

	const secondPersonUnitUsed = onlyTwoDigits(data.secondPerson.currentUnit - data.secondPerson.previousUnit)
	lines.push(`${data.secondPerson.name} used: ${data.secondPerson.currentUnit}-${data.secondPerson.previousUnit} = ${secondPersonUnitUsed} unit`)

	if (firstPersonUnitUsed === secondPersonUnitUsed) {
		lines.push('Both used equal units, no one should pay anything.')
		generateImage(lines, filename)
		return
	}

	lines.push('\n')

	const totalUnitUsed = onlyTwoDigits(firstPersonUnitUsed + secondPersonUnitUsed)
	lines.push(`Total unit used: ${firstPersonUnitUsed}+${secondPersonUnitUsed} = ${totalUnitUsed} unit`)

	const perUnitCost = onlyTwoDigits(data.totalMoney / totalUnitUsed)
	lines.push(`Per unit cost: ${data.totalMoney}/${totalUnitUsed} = ${perUnitCost} taka`)

	const perPersonUnitShare = onlyTwoDigits(totalUnitUsed / 2)
	lines.push(`Per person will get: ${totalUnitUsed}/2 = ${perPersonUnitShare} unit`)

	lines.push('\n')

	if (firstPersonUnitUsed > perPersonUnitShare) {
		const excessUsed = onlyTwoDigits(Math.abs(firstPersonUnitUsed - perPersonUnitShare))
		lines.push(`${data.firstPerson.name} excess used: ${firstPersonUnitUsed}-${perPersonUnitShare} = ${excessUsed} unit`)
		const shouldBePaid = Math.round(excessUsed * perUnitCost)
		if (shouldBePaid === 0) {
			lines.push(`${data.firstPerson.name} shouldn't pay anything as they used very little excess electricity.`)
		} else {
			lines.push(`${data.firstPerson.name} should pay: ${excessUsed}*${perUnitCost} = ${shouldBePaid} taka`)
		}
	} else {
		const excessUsed = onlyTwoDigits(Math.abs(secondPersonUnitUsed - perPersonUnitShare))
		lines.push(`${data.secondPerson.name} excess used: ${secondPersonUnitUsed}-${perPersonUnitShare} = ${excessUsed} unit`)
		const shouldBePaid = Math.round(excessUsed * perUnitCost)
		if (shouldBePaid === 0) {
			lines.push(`${data.secondPerson.name} shouldn't pay anything as they used very little excess electricity.`)
		} else {
			lines.push(`${data.secondPerson.name} should pay: ${excessUsed}*${perUnitCost} = ${shouldBePaid} taka`)
		}
	}

	generateImage(lines, filename)
}

;(async () => {
	const firstPersonName = await input({
		message: "Enter first person's name:",
		required: true,
		validate: (value: string) => (value.trim() === '' ? 'Name cannot be empty' : true)
	})
	const firstPersonPreviousUnit = await input({
		message: "Enter first person's previous unit:",
		required: true,
		validate: (value: string) => (isNaN(parseFloat(value)) ? 'Previous unit must be a number' : true)
	})
	const firstPersonCurrentUnit = await input({
		message: "Enter first person's current unit:",
		required: true,
		validate: (value: string) => (isNaN(parseFloat(value)) ? 'Current unit must be a number' : true)
	})

	const secondPersonName = await input({
		message: "Enter second person's name:",
		required: true,
		validate: (value: string) => (value.trim() === '' ? 'Name cannot be empty' : true)
	})
	const secondPersonPreviousUnit = await input({
		message: "Enter second person's previous unit:",
		required: true,
		validate: (value: string) => (isNaN(parseFloat(value)) ? 'Previous unit must be a number' : true)
	})
	const secondPersonCurrentUnit = await input({
		message: "Enter second person's current unit:",
		required: true,
		validate: (value: string) => (isNaN(parseFloat(value)) ? 'Current unit must be a number' : true)
	})

	const totalMoney = await input({
		message: 'Enter total money:',
		required: true,
		validate: (value: string) => (isNaN(parseFloat(value)) ? 'Total money must be a number' : true)
	})

	const data: DataType = {
		firstPerson: {
			name: firstPersonName,
			previousUnit: parseFloat(firstPersonPreviousUnit),
			currentUnit: parseFloat(firstPersonCurrentUnit)
		},
		secondPerson: {
			name: secondPersonName,
			previousUnit: parseFloat(secondPersonPreviousUnit),
			currentUnit: parseFloat(secondPersonCurrentUnit)
		},
		totalMoney: parseFloat(totalMoney)
	}

	calculate(data)
})()
