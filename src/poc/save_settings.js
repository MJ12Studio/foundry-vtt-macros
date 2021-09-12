console.clear();
console.log(game);
//console.log(game.world);

//console.log(game.world);

let settings = game.settings.storage;
console.log(settings);

main()
async function main(){
    //let loot = {};
    //loot.overall_sell_percent = 75;
    //loot.overall_buy_percent = 125;
    
    game.settings.register("MJMacros", "testSettings", {
        scope: "world",
        config: false,
        default: 50,
        type: Number
    });
    //await game.settings.set("MJMacros", "testSettings", 75);
    let x = await game.settings.get("MJMacros", "testSettings");
    //await game.settings.delete("MJMacros", "testSettings");
    
    game.settings.register("MJMacros", "looter", {
        scope: "world",
        config: false,
        default: {empty: true},
        type: Object
    });
    //await game.settings.set("MJMacros", "looter", {percent_sell: 75, percent_buy:110});
    //await game.settings.set("MJMacros", "looter", {data: '1/1/2021'}); //Will overwrite entire object
    //await game.settings.set("MJMacros", "looter", {});
    //let x = await game.settings.get("MJMacros", "looter");
    
    
    
    
    
    
    
    
    
    console.log(x);
    
    
    
    //await game.settings.storage.set('world.MJ_percent_sell', 75);
    
    //let x = game.settings.storage.get('world.MJ_percent_sell');
    
    
   //await canvas.scene.setFlag('world', 'mjsettings_percent_sell', 75);
   //let x = canvas.scene.getFlag('world', 'mjsettings_percent_sell');
   
   //Does not work
   //await game.world.data.setFlag('world', 'mjsettings_percent_sell', 75);
   //let x = game.world.data.getFlag('world', 'mjsettings_percent_sell');
   
   //
   //let updates = [];
   //updates["WorldData.mjsettings_percent_sell"] = 75;
   //let obj = updates.toObject();
   
   //console.log(updates);
   
   //await game.world.data.document.update(updates);
   
   
    /*let data = {
      name: 'MJLoot',
      scope: 'world',     // "world" = sync to db, "client" = local storage 
      config: false,       // false if you dont want it to show in module config
      type: Object,
      default: {},
    }*/
    //await game.settings.register('core', 'MJLoot', data);
    //await game.settings.set('core','MJLoot',loot);
    //let x = await game.settings.get('core','MJLoot');
    
    /*
    await game.settings.register('MJSettings', 'percent_sell', {
        name: 'Percent Sell',
        default: 0,
        type: Number,
        scope: 'world',
        config: true
    });
    */
    
    //this will create a persistent setting that you can set/get via
    //await game.settings.set('MJSettings', 'percent_sell', 85)
    //let x = await game.settings.get('MJSettings', 'percent_sell')

   


    
    //console.log(canvas.scene);
    
    //await canvas.scene.unsetFlag('myModule', 'myFlag');
    
    
}