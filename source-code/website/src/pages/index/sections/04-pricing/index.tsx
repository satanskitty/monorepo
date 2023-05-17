import { Show } from "solid-js"
import { SectionLayout } from "../../components/sectionLayout.jsx"
import { Button } from "../../components/Button.jsx"

const data = {
	title: "inlang stays free",
	caption: "Pricing",
	description:
		"Individual use and generous free tier will be provided because we consider word of mouth from satisfying developers as the best marketing to charge larger enterprise.",
	button: "Why the pricing stays free",
	buttonLink: "/docs/plugins/jsonPlugin",
}

const Pricing = () => {
	return (
		<SectionLayout type="white" showLines={true}>
			<div class="flex justify-between px-10 py-32">
				<div class="w-[calc((100%_-_40px)_/_2)] flex flex-col gap-4">
					<p class="text-xs text-primary bg-primary/10 h-7 flex items-center px-4 rounded-full w-fit">
						{data.caption}
					</p>
					<h2 class="text-3xl font-semibold text-on-background leading-relaxed tracking-tight">
						{data.title}
					</h2>
					<p class="text-base md:w-[90%] text-outline-variant">{data.description}</p>
					<div class="pt-4">
						<Button href={data.buttonLink} type="secondary">
							{data.button}
						</Button>
					</div>
				</div>
				<div class="w-[calc((100%_-_40px)_/_2)] flex items-end pl-4">
					<div class="h-full w-[55%] rounded-2xl rounded-br-none flex flex-col p-8 gap-4 bg-gradient-to-b from-hover-primary/70 to-hover-primary/30">
						<p class="h-7 flex items-center px-3 rounded-full bg-background/50 w-fit text-surface-600 text-sm">
							free
						</p>
						<p class="grow font-semibold text-xl text-surface-900/80">
							Individuals and Open Source
						</p>
						<p class="font-semibold text-surface-900 text-3xl">$0</p>
					</div>
					<div class="h-[80%] w-[45%] rounded-2xl rounded-l-none flex flex-col p-8 gap-4 bg-surface-1 border border-surface-2">
						<p class="h-7 flex items-center px-3 rounded-full bg-surface-500/10 w-fit text-surface-600 text-sm">
							paid
						</p>
						<p class="grow font-semibold text-xl text-surface-900/80">Enterprise</p>
						<p class="font-semibold text-surface-900 text-3xl">soon</p>
					</div>
				</div>
			</div>
		</SectionLayout>
	)
}

export default Pricing
