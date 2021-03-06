import template from "./index.marko";
import Auth from "../../../../shared/lib/auth";
import C from "../../../../shared/lib/constants";

export default (programs) => ({
    async handler(req, rep) {
        const response = new this.Response(req, rep);
        if (!req.params || !req.params.programId || !programs[req.params.programId]) {
            rep.callNotFound();
            return rep.code(204);
        }
        const auth = new Auth(this.mongo.db, this, req, rep, C.USE_COOKIE_FOR_TOKEN);
        const site = new req.ZoiaSite(req, "edu", this.mongo.db);
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
                        program: true,
                        routes: true,
                        programId: true,
                        ...site.getSerializedGlobals()
                    },
                    template: req.zoiaTemplates[0],
                    pageTitle: site.i18n.t("programs"),
                    programId: req.params.programId,
                    program: programs[req.params.programId],
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
