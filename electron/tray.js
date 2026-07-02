const { Tray, Menu, app, shell } = require("electron");
const path = require("path");

let tray = null;

function createTray(){

  tray = new Tray(

    path.join(

      __dirname,

      "assets",

      "printflow.png"

    )

  );

  const menu = Menu.buildFromTemplate([

    {

      label:"PrintFlow Agent",

      enabled:false

    },

    {

      label:"Open Dashboard",

      click:()=>{

        shell.openExternal(

          "http://localhost:5001"

        );

      }

    },

    {

      label:"Open Printed Files",

      click:()=>{

        shell.openPath(

          path.join(

            __dirname,

            "..",

            "printed-orders"

          )

        );

      }

    },

    {

      type:"separator"

    },

    {

      label:"Quit",

      click:()=>{

        app.quit();

      }

    }

  ]);

  tray.setToolTip(

    "PrintFlow Agent"

  );

  tray.setContextMenu(

    menu

  );

}

module.exports = {

  createTray

};