import template from "./index.marko";
import Auth from "../../../../shared/lib/auth";

export default (programs) => ({
    async handler(req, rep) {
        const auth = new Auth(this.mongo.db, this, req, rep);
        const site = new req.ZoiaSite(req, "edu", this.mongo.db);
        const response = new this.Response(req, rep, site);
        if (!(await auth.getUserData()) || !auth.checkStatus("active")) {
            auth.clearAuthCookie();
            return response.redirectToLogin(req.zoiaModulesConfig["edu"].routes.admin);
        }
        site.setAuth(auth);
        try {
            const render = await template.stream({
                $global: {
                    serializedGlobals: {
                        template: true,
                        pageTitle: true,
                        programs: true,
                        routes: true,
                        ...site.getSerializedGlobals()
                    },
                    template: req.zoiaTemplates[0],
                    pageTitle: site.i18n.t("programs"),
                    programs,
                    routes: {
                        ...req.zoiaModulesConfig["edu"].routes,
                    },
                    ...await site.getGlobals(),
                }
            });
            return response.sendHTML(render);
        } catch (e) {
            return Promise.reject(e);
        }
    }
});
