import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
//#region src/routes/campaigns_.new.tsx
var $$splitComponentImporter = () => import("./campaigns_.new-BpoRaZ7b.js");
var Route = createFileRoute("/campaigns_/new")({
	validateSearch: (search) => {
		return { editId: search.editId };
	},
	head: () => ({ meta: [{ title: "New Campaign — DMOrbit" }] }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { Route as t };
