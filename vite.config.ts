import { defineConfig, PluginOption } from "vite";
import lygia from "vite-plugin-lygia-resolver";
import analyzer from "vite-bundle-analyzer";
import path from "path";

export default defineConfig(({ mode }) => {
	const analyzeBundle = process.env.ANALYZE && mode === "production";
	return {
		plugins: [
			lygia(),
			...(analyzeBundle ? [analyzer() as PluginOption] : []),
		],
		resolve: {
			alias: {
				"@": path.resolve(__dirname, "./src/"),
			},
		},
	};
});
