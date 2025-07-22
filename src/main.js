import {
	createSSRApp
} from "vue";
import App from "./App.vue";
// main.js 或 App.vue


export function createApp() {
	const app = createSSRApp(App);
	return {
		app,
	};
}
