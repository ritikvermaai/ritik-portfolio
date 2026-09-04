const themeRoutes=require("./theme.routes");const healthRoutes=require("./health.routes");module.exports=({app,requireAdmin})=>{app.use(themeRoutes({requireAdmin}));app.use(healthRoutes);};
