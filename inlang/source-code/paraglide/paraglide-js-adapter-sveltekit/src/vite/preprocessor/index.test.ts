import { describe, it, expect } from "vitest"
import { CompileOptions, preprocess } from "svelte/compiler"
import { preprocessor as createPreprocessor } from "./index"
import { rollup } from "rollup"
import virtual from "@rollup/plugin-virtual"
import { nodeResolve } from "@rollup/plugin-node-resolve"
import { compile } from "svelte/compiler"
import { PARAGLIDE_CONTEXT_KEY } from "../../runtime/constants"

const preprocessor = createPreprocessor({})

//Make sure these tests are run concurrently - Otherwise they will take forever
describe("preprocessor", () => {
	it.concurrent("leaves non-translatable attributes alone", async () => {
		const code = `<a href="/test" data-no-translate>Test</a>`
		const html = await renderComponent(code)
		expect(html).toBe(`<a href="/test" data-no-translate>Test</a>`)
	})

	it.concurrent("translates hardcoded href attributes", async () => {
		const code = `<a href="/test">Test</a>`
		const html = await renderComponent(code)
		expect(html).toBe(`<a href="/rewritten">Test</a>`)
	})

	it.concurrent("translates parameterized href attributes", async () => {
		const code = `
        <script>
            const href = "/test"
        </script>
        <a href={href}>Test</a>`

		const html = await renderComponent(code)
		expect(html).toBe(`<a href="/rewritten">Test</a>`)
	})

	it.concurrent("translates links inside {#if} blocks", async () => {
		const code = `
        <script>
            const href = "/test"
			const show = true;
        </script>
		{#if show}
        	<a href={href}>Test</a>
		{/if}
		`

		const html = await renderComponent(code)
		expect(html).toBe(`<a href="/rewritten">Test</a>`)
	})

	it.concurrent("translates links inside {:else} blocks", async () => {
		const ifCode = `
		{#if false}
			<span>If</span>
		{:else}
        	<a href = "/test">Test</a>
		{/if}
		`

		const eachCode = `
		{#each [] as item}
			<span>Each</span>
		{:else}
			<a href = "/test">Test</a>
		{/each}
		`

		const elseIfCode = `
		{#if false}
			<span>If</span>
		{:else if true}
			<a href = "/test">Test</a>
		{:else}
			<span>Else</span>
		{/if}
		`

		const ifHtml = await renderComponent(ifCode)
		const eachHtml = await renderComponent(eachCode)
		const elseIfHtml = await renderComponent(elseIfCode)

		expect(ifHtml).toBe(`<a href="/rewritten">Test</a>`)
		expect(eachHtml).toBe(`<a href="/rewritten">Test</a>`)
		expect(elseIfHtml).toBe(`<a href="/rewritten">Test</a>`)
	})

	it.concurrent("translates links inside {:then} and {:catch} blocks", async () => {
		const code = `
		<script>
			const promise = "not a promise -> resolves instantly"
		</script>
		{#await promise}
			<span>Awaiting</span>
		{:then}<a href = "/test">Test</a>{/await}
		`

		const html = await renderComponent(code)
		expect(html).toBe(`<a href="/rewritten">Test</a>`)
	})

	it.concurrent("translates shorthand href attributes", async () => {
		const code = `
        <script>
            const href = "/test"
        </script>
        <a {href}>Test</a>`

		const html = await renderComponent(code)
		expect(html).toBe(`<a href="/rewritten">Test</a>`)
	})

	it.concurrent("uses the hreflang attribute", async () => {
		const code = `<a href="/test" hreflang="de" />`

		const html = await renderComponent(code)
		expect(html).toBe(`<a href="/rewritten/de" hreflang="de"></a>`)
	})

	it.concurrent("uses the hreflang attribute with shorthand", async () => {
		const code = `
        <script>
            const lang = "de"
        </script>
        <a href="/test" hreflang={lang} />`

		const html = await renderComponent(code)
		expect(html).toBe(`<a href="/rewritten/de" hreflang="de"></a>`)
	})

	it.concurrent("translates the spread operator - no hreflang", async () => {
		const code = `
        <script>
            const props = { href: "/test" }
        </script>
        <a {...props} />`

		const html = await renderComponent(code)
		expect(html).toBe(`<a href="/rewritten"></a>`)
	})

	it.concurrent("translates the spread operator - with hreflang", async () => {
		const code = `
        <script>
            const props = { href: "/test", hreflang: "de" }
        </script>
        <a {...props} />`

		const html = await renderComponent(code)
		expect(html).toBe(`<a href="/rewritten/de" hreflang="de"></a>`)
	})

	it.concurrent.only("translates <svelte:element> tags if they are links", async () => {
		const hardcoded = `<svelte:element this="a" href="/test" hreflang="de" />`
		const parameterized = `<script>
			const as = "a"
		</script>
		<svelte:element this={as} href="/test" hreflang="de" />`

		const hardcodedHtml = await renderComponent(hardcoded)
		const parameterizedHtml = await renderComponent(parameterized)

		expect(hardcodedHtml).toBe(`<a href="/rewritten/de" hreflang="de"></a>`)
		expect(parameterizedHtml).toBe(`<a href="/rewritten/de" hreflang="de"></a>`)
	})

	it.concurrent("doesn't translate <svelte:element> tags if they are not links", async () => {
		const hardcoded = `<svelte:element this="div" href="/test" hreflang="de" />`
		const parameterized = `
        <script>
            const as = "div"
        </script>
        <svelte:element this={as} href="/test" hreflang="de" />`

		const hardcodedHtml = await renderComponent(hardcoded)
		const parameterizedHtml = await renderComponent(parameterized)

		expect(hardcodedHtml).toBe(`<div href="/test" hreflang="de"></div>`)
		expect(parameterizedHtml).toBe(`<div href="/test" hreflang="de"></div>`)
	})

	/* Future Goals
	it.concurrent("translates the spread operator - with external hreflang", async () => {
		const code = `
        <script>
            const props = { href: "/test" }
        </script>
        <a {...props} hreflang="de" />`

		const html = await renderComponent(code)
		expect(html).toBe(`<a href="/rewritten/de" hreflang="de"></a>`)
	})

	it.concurrent("handles conflicting hreflang values (last one wins)", async () => {
		const code = `
        <script>
            const props_1 = { href: "/test", hreflang: "en" }
            const props_2 = { hreflang: "de" }
        </script>
        <a {...props_1} hreflang="fr" {...props_2} />`

		const html = await renderComponent(code)
		expect(html).toBe(`<a href="/rewritten/de" hreflang="de"></a>`)
	})
    */
})

/**
 * Takes in a svelte component -> preprocesses it -> SSRs it in context -> returns the html
 *
 * This truly is one of the test utilities of all time
 */
async function renderComponent(svelteCode: string, props: Record<string, any> = {}) {
	const EntrySvelteCode = `
    <script>
        import Component from './Component.svelte'
        import { setContext } from 'svelte';

        setContext('${PARAGLIDE_CONTEXT_KEY}', {
            translateHref: (href, lang) => {
                let value = '/rewritten'
                if(lang) value += '/' + lang
                return value
            }
        });
    </script>
    <Component />
    `
	const compilerOptions: CompileOptions = { generate: "ssr" }

	const preprocessedEntry = await preprocess(EntrySvelteCode, preprocessor, {
		filename: "src/Entry.svelte",
	})
	const preprocessedComponent = await preprocess(svelteCode, preprocessor, {
		filename: "src/Component.svelte",
	})

	console.log(preprocessedComponent.code)

	const bundle = await rollup({
		input: "src/Entry.svelte",
		plugins: [
			virtual({
				"src/Entry.svelte": compile(preprocessedEntry.code, compilerOptions).js.code,
				"src/Component.svelte": compile(preprocessedComponent.code, compilerOptions).js.code,
			}),
			nodeResolve(),
		],
	})

	const compiledBundle = await bundle.generate({ format: "esm" })
	const module = await import("data:text/javascript;base64," + btoa(compiledBundle.output[0].code))
	const Component = module.default
	const { html } = Component.render(props)
	return html
}
