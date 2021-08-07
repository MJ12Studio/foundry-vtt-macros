/*
    ===============================================================================================
    Public Release notes
    ===============================================================================================
    1. Macro only for 1st release
    2. Must-Have features for public-release:

        =============== Completed Features ===============
        * Adjust CR, HP, Abilities, Movement, Spells, Weapons, Armor
            * Figured out how to add items for compendiums on the fly
            * Figured out how to add items on the fly from raw data
        * Social Status, Luck
            * Social Status bonus for Charisma
        * Add gold, Gems
        * Templates
        * Fix AC base value
        * Scale Non-Humanoid damage

        
        =============== Questions Unanswered ===============
        Q: Can we access external javascript data files (github, bitbucket) for lists, arrays?
        Q: Do we want to make our money on this project? OR drive traffic to something else, like adventure modules?
            * Adventure modules could be designed to work with NPC Adjust.
            * Maybe instead of Patreon for this we just sell Adventure modules that auto-scale
        
        
        =============== Questions Answered ===============
        Q: How do we get our macro accepted to the Community Macros?
            A: Looks like we need no special permission, we just add it here: https://github.com/foundry-vtt-community/macros
        Q: Can we use external images for our items?
            A: Yes. Tested with GitHub.
        Q: Can we create an item on the fly without a compendium
            A: Yes... See Gold and treasure
        
        =============== To-Do's ===============

            == Narrative / Biography ==    
            __ Should we choose Gender?  May help choose things like jewelry
            __ Should we choose name?
            __ Should we include some character traits, disposition, history, etc
                for flavor and DM use?

        

        *** Add a help button on the start dialog to popup a help dialog.
    
        *** Add a checkbox that is unchecked by default for "Allow exceed 5e SRD rules" <-- something like this...

        * Loot that is carried on the NPC

            * Add a button to just generate loot
            
            * Misc Magic Items

        For Humanoid NPC
            *+Pluses for Armor and Weapons needs tweaked to be more fair/random
                
            * Multi-attacks (Fighters get theirs at level 3)
                *Add or Upgrade
                If humanoid AND a fighter-template then:
                    * At 3rd = 2 attacks
                    * At 12th = 3 attacks
                Spellcasters get no multi-attacks
            * Do we add a hierarchy
        For Non-Humanoid NPC
            
            *** Don't mess with their multi-attacks and their weapons
                * Scale damage is OK, but don't clear them and try to add new ones
            
            Intelligent
                
                
            Non-Intelligent        
                No spells
                
    
***** Notes to users:
    * Upgrading an NPC with less that CR 1 by 0 will make the NPC CR 1.
    
    
    ===============================================================================================

    Questions:
        
        * Armor
            Need a better way to hand out armor
            When to add a shield


    ===============================
    Wish list for version 2
    ===============================
    Humanoids, Non-humanoids
        *Features - build in some logic for who gets what
            Auras:
                "Dark Aura","Death Burst","Fear Aura","Fetid Cloud","Fire Aura"
            
            Attacks:
                Low-Level:  "Acid Spray","Aggressive","Brave","Charge","Cunning Action","Dreadful Glare","Enlarge","Fling","Frost Breath","Heated Body"
            
                Medium-level: "Assassinate","Blinding Breath","Blood Frenzy","Deadly Leap","Disrupt Life","Firat Roar","Frightening Gaze","Haste","Healing Touch"
            
                High-Damage: "Acid Breath","Channel Negative Energy","Cold Breath","Death Throes","Ethereal Jaunt","Fire Breath","Frightful Presence"
            
            *Defense/Immunities:
                "Acid Absorption","Dark Devotion","Evasion","Fire Absorption","Heal Self","Horrific Appearance"

    
    
    * Senses/Skills
        "Amphibious","Devil Sight", "Ethereal Sight","Freedom of Movement","Hold Breath"

    * Generate Loot in a horde or treasure chest
    
    *** Reset Token Button

    ===============================
    Wish List for version 3+
    ===============================
    
    * Advanced Settings:
        * Add ability to tweak settings like CR/level for damage, etc for users
    
    * DAE Item that heals when certain damage would be taken
    Features based on Monster type (Undead, beast, celestial)

    Which Non-Humanoids can wear armor, use weapons?
        Make lookup tables for this.
    * Come up with various ways to distribute loot

    Items (Magic Items)

    New Options
        * Have Percentage chance/cr for each selected creature to become a definite class
            Checkbox    and     dropdown percentage picker

    Add more randomness to HP
    
    ======================= Additional Macros/Modules ==================================
    * Resurrect entire scene
        * Give everyone treasure/loot
        
    * Make module to be able to use skills
        * Make magic weapons

    * Token info

    * Monster Survey
    
    * Macro to make magic items easily for DMs
        * Dialog screen with options
        * Automated routine for generating loot 

*/

dialog_start();

async function main(opt){
    opt.npc_count = await npc_count_get();
    opt.party_level_average = await party_level_average_get()

    for (let token of canvas.tokens.controlled){    //Loop through all selected tokens
        if (token.actor.type != "npc"){ continue; } //Skip it if it's not an npc

        let TADD = token.actor.data.data;           //Used for READING data from token
        let AD   = "actorData.data.";               //Used for WRITING data to token

        /*
        //Scale all Token info
            Do we have original_data?
            CR, HP, Abilities, AC
            
        //Scale Items
            Loop through all items{
                Do we have original_data?
                
                Non-H
                    Get better Attacks/damage, treasure
                Humanoid
                    Get new weapons, armor, spells, shield, treasure, misc items
            }
            

        //Scale effects (Maybe)
        */

        //Check for original data
        console.log(token.actor);
        let temp_actorData = token.actor.original_actorData;
        if (!temp_actorData){
            console.log("No Original Data");
            temp_actorData = await token.actor.data;
            
            //console.log(token.actor.items);
            //console.log(typeof token.actor.items)
            //let temp_items = token.actor.items;
            //let temp_effects = token.actor.effects;

            let updates = [];
            updates["actorData.data.original_data"] = temp_actorData;
            //updates["actorData.data.original_items"] = temp_items.toObject();
            //updates["actorData.data.original_effects"] = temp_effects.toObject();

            await token.document.update(updates);

            //tok.data_to_update[AD+"attributes.hp.max"] = tok.hp;
            //await token.document.update(tok.data_to_update); 
        }
        console.log(token.actor);
        /*  token.actor.original_data   
            if (yes){
                tok = read in original data
            } no {
                tok = token.actor.data
            }
        */
        
        
        
        
        
        

        continue;

        //Reset some params for each token
        let tok = [];                               //tok = temp object holding adjustments.
        tok.abilities = [];
        tok.data_to_update = [];                    //List of values to update in a token
        tok.item_types_to_delete = [];
        tok.items_to_add_compendium = [];
        tok.items_to_add_raw = [];
        tok.items_to_delete = [];                   //List of items to delete
        //tok.items_updates = [];                     //List of updates to make to items
        tok.movement = [];
        tok.opt = opt;                              //tok.opt = options from HTML dialog form
        tok.originals = [];

        await cr_and_originals_get(tok, AD, TADD, opt);  //CR and originals

        //Misc Token info
        tok.alignment = TADD.details.alignment;                       //Alignment
        tok.gender = gender_get();
        tok.race = TADD.details.race
        tok.is_humanoid = is_humanoid(TADD.details.type.value);
        tok.max_spell_level = spell_level_get_max(tok.cr_new);
        tok.spellcaster_type = TADD.attributes.spellcasting;

        //Social Status, Luck
        tok.social_status = social_status_get(token,tok);
        tok.luck = roll_bell_curve_1000();
        tok.xp = experience_points_get(tok.cr_new);
        tok.adjusted_cr = Math.round(tok.cr_new * tok.social_status * tok.luck);    //Rounds up if >= 0.5

        //Read in template
        tok.template = await template_choose(tok);

        //tok.type = is_humanoid(TADD.details.type.value);              //Type of NPC (Humanoid, etc)        

        //Abilities Adjust
        if (tok.opt.adjust_abilities){
            for (let ability of tok.template.abilities){
                //console.log("ability to upgrade: " + ability);
                tok.data_to_update[AD+"abilities." + ability + ".value"] = tok.abilities[ability] + Math.round(tok.cr_change_since_orig/3)
            }
        }
        
        //Clear AC Flat Value
        tok.data_to_update[AD+"attributes.ac.flat"] = null;

        //HP Adjust
        if (opt.adjust_hp){
            let hp = TADD.attributes.hp.max;
            tok.hp = (tok.cr_new * 12) + (Math.round((tok.abilities.con - 10) / 2) * tok.cr_new);
            tok.data_to_update[AD+"attributes.hp.max"] = tok.hp;
        }

        
        
    
        //Do some things based on humanoid/non-humanoid
        tok.item_types_to_delete.push("loot");
        if (!tok.is_humanoid){
            //Movement Adjust: Adjust up or down by 1 foot per CR 
            for (let m of ["burrow","climb","fly","swim","walk"]){
                let cur_m = TADD.attributes.movement[m];
                if (cur_m > 0){
                    tok.movement[m] = Math.round(cur_m + tok.cr_new);
                    tok.data_to_update[AD+"attributes.hp.movement." + m] = tok.movement[m];
                }
            }
        } else {
            //Humanoid
            if (tok.opt.clear_armor){    tok.item_types_to_delete.push("equipment"); }
            //if (tok.opt.clear_features){ item_types_to_delete.push("feat"); }
            if (tok.opt.clear_spells){   tok.item_types_to_delete.push("spell"); }
            if (tok.opt.clear_weapons){  tok.item_types_to_delete.push("weapon"); }
            
        }

        //Items Adjust
        for (let item of token.actor.items){
            tok.items_updates = [];
            console.log("item: " + item.name);
            console.log(item);
            //console.log("is_humanoid: " + tok.is_humanoid)
            if (tok.is_humanoid){
                //console.log("   isHumanoid!");
                //Weapons / Armor
                if (item.type === "weapon"){
                    //console.log("   weapon")
                    let new_name = "";
                    if (tok.template.weapon_plus > 0){
                        new_name = " +" + tok.template.weapon_plus;                        
                    }
                    let weapon = "";
                    if (item.data.data.properties.two){
                        //console.log("   two-handed weapon")
                        if (item.name.indexOf("bow") > -1){
                            //console.log("   bow")
                            //Add a bow
                            let n = tok.template.weapons_2_handed_range.length;
                            let r = roll_simple(n)-1;
                            weapon = tok.template.weapons_2_handed_range[r];
                        } else {
                            //console.log("   non-range weapon")
                            //Add a hand weapon
                            let n = tok.template.weapons_2_handed.length;
                            let r = roll_simple(n)-1;
                            weapon = tok.template.weapons_2_handed[r];
                        }
                    } else {
                        //console.log("   one-handed weapon")
                        if (item.data.data.properties.amm || item.data.data.properties.thrown){
                            //Add a ranged one-handed weapon
                            //console.log(tok.template.weapons_1_handed_range)
                            //console.log(tok);
                            let n = tok.template.weapons_1_handed_range.length;
                            let r = roll_simple(n)-1;
                            weapon = tok.template.weapons_1_handed_range[r];
                        } else {
                            //Add a non-ranged one handed weapon
                            //console.log(tok.template.weapons_1_handed)
                            //console.log(tok);
                            let n = tok.template.weapons_1_handed.length;
                            let r = roll_simple(n)-1;
                            weapon = tok.template.weapons_1_handed[r];                            
                        }

                    }
                    new_name = weapon + new_name;
                    //console.log("Trying to add weapon: " + new_name);
                    tok.items_to_add_compendium.push(["dnd5e.items", new_name])
                } else {
                    //log("Armor", item.data.data.armor)
                    if (item.data.data.armor){
                        let armor_plus_str = await armor_get(tok);
                        tok.items_to_add_compendium.push(["dnd5e.items", armor_plus_str])
                    }
                }
                
            } else {
                console.log("Non-Humanoid");
                if (item.type === "weapon"){
                    let original_damage = item.data.data.original_damage;
                    console.log("Original original_damage: " + original_damage);
                    if (!original_damage){
                        console.log("NO original_damage")
                        tok.items_updates.push({
                            _id:item.id,
                            data: {
                                original_damage: item.data.data.damage.parts[0][0]
                            }
                        });
                        original_damage = item.data.data.damage.parts[0][0];
                    } else {
                        original_damage = item.data.data.damage.parts[0][0];
                    }
                    console.log("Original Damage: " + original_damage);

                    let dPos = original_damage.indexOf("d");
                    let d = parseInt(original_damage.substr(0,dPos));
                    if (d > 0){
                        //console.log("D: " + d);
                        let newD = d + Math.round(tok.cr_change_since_orig/2);
                        //console.log("newD: " + newD);
                        if (d + newD < 0){ newD = 1; }
                        let new_damage = newD + original_damage.substr(dPos,1000);
                        //console.log("new_damage: " + new_damage);
                        let damage_type = item.data.data.damage.parts[0][1]
                        let data = item.data.data;
                        console.log(data);
                        data.damage.parts[0][0] = new_damage;
                        data.damage.parts[0][1] = damage_type;
                        tok.items_updates.push({
                            _id:item.id,
                            data: data,
                            name: "Fucking big fist"
                        });
                    }
                }
            }
            await items_update(item, tok.items_updates);
        }
        
        //Add spells for spellcasters
        if (tok.spellcaster_type){
            for (let level = 1; level <= tok.max_spell_level; level++){
                for (let spell of tok.template.spell_list[level]){
                    tok.items_to_add_compendium.push(["dnd5e.spells", spell]);
                }
            }
            tok.data_to_update[AD+"details.spellLevel"] = tok.cr_new;
        }

        //Add coins, treasure
        tok.base_gp = Math.round((Math.round(tok.xp/10) * tok.social_status * tok.luck) + roll_simple(tok.adjusted_cr));
        let gem_percent = 50 + roll_simple(50);
        let gem_value = Math.round(tok.base_gp * (gem_percent/100));
        let gem_qty = roll_simple(tok.cr_new);
        let gp_value = tok.base_gp - gem_value;
        if (gem_value > 0){
            tok.items_to_add_raw.push({
                name: "Ancient Necklace",
                type: "loot",
                data: {
                    quantity: gem_qty,
                    price: gem_value,
                }
            });
        }
        if (gp_value > 0){
            tok.items_to_add_raw.push({
                name: "Gold Pieces (" + gp_value + ")",
                type: "loot",
                data: {
                    quantity: gp_value,
                    price: gp_value,
                },
            });
        }

        //Do all updates that need done to this token
        await item_types_remove(token, tok);                //Remove all selected item types
        await items_add(token, tok);                        //Add all items
        await items_equip_all(token);                       //Equip, identify, make proficient all items
        await token.document.update(tok.data_to_update);    //Update all token data at once!
        await token.actor.longRest({ dialog: false });      //Refresh spellslots and hp
        

        console.group("tok group");
        console.log(tok);
        console.log(token);
        console.log(token.actor.data.items);
        console.groupEnd();
        
    }
    console.log("Finished processing tokens...");

}

            

            


        // Do they have a shield?

    
        
        // Maybe later =============================================
        //Upgrade weapons
        //    Club -> Mace -> Great Mace
        
        
        


        //Add some languages?
        
        //Add special senses?


        //Adjust Age


/*=================================================================
    Functions
  =================================================================*/
async function armor_get(tok){
    let armor = [];
    armor.push("None");                     // 10 0
    armor.push("Padded Armor");             // 11 1
    armor.push("Leather Armor");            // 11 2
    armor.push("Studded Leather Armor");    // 12 3
    armor.push("Hide Armor");               // 12 4
    armor.push("Chain Shirt");              // 13 5
    armor.push("Breastplate");              // 14 6
    armor.push("Ring Mail");                // 14 7
    armor.push("Scale Mail");               // 14 8
    armor.push("Half Plate Armor");         // 15 9
    armor.push("Chain Mail");               // 16 10
    armor.push("Splint Armor");             // 17 11
    armor.push("Plate Armor");              // 18 12
    let armor_number = 0;
    if (tok.adjusted_cr > 12){ tok.adjusted_cr = 12; }
    if (tok.adjusted_cr > 0 && tok.adjusted_cr < 5){ armor_number = roll_simple(4); }
    if (tok.adjusted_cr > 4 && tok.adjusted_cr < 9){ armor_number = roll_simple(4) + 4; }
    if (tok.adjusted_cr >= 10){                  armor_number = roll_simple(4) + 8; }
    if (tok.template.armor_plus > 0){
        return armor[armor_number] + " +" + tok.template.armor_plus;
    } else {
        return armor[armor_number];
    }
}
async function can_cast_spells(token){
    let spellcasting = false;
    for (let i of token.actor.items){
        if (i.data.name == "Spellcasting"){
            spellcasting = true;
        }
    }
    return spellcasting;
}
async function cr_and_originals_get(tok, AD, TADD, opt){
    //CR and originals
    tok.cr = TADD.details.cr;
    if (tok.cr < 1){ tok.cr = 1; }
    tok.originals.cr = TADD.originals?.cr;
    if (!tok.originals.cr){
        tok.originals.cr = tok.cr;
        tok.data_to_update[AD+"originals.cr"] =     tok.originals.cr;
        tok.data_to_update[AD+"originals.cha"] =    TADD.abilities.cha.value;
        tok.data_to_update[AD+"originals.con"] =    TADD.abilities.con.value;
        tok.data_to_update[AD+"originals.dex"] =    TADD.abilities.dex.value;
        tok.data_to_update[AD+"originals.int"] =    TADD.abilities.int.value;
        tok.data_to_update[AD+"originals.str"] =    TADD.abilities.str.value;
        tok.data_to_update[AD+"originals.wis"] =    TADD.abilities.wis.value;
        tok.data_to_update[AD+"originals.burrow"] = TADD.attributes.movement.burrow;
        tok.data_to_update[AD+"originals.climb"] =  TADD.attributes.movement.climb;
        tok.data_to_update[AD+"originals.fly"] =    TADD.attributes.movement.fly;
        tok.data_to_update[AD+"originals.swim"] =   TADD.attributes.movement.swim;
        tok.data_to_update[AD+"originals.walk"] =   TADD.attributes.movement.walk;

        tok.abilities.cha = TADD.abilities.cha.value;
        tok.abilities.con = TADD.abilities.con.value;
        tok.abilities.dex = TADD.abilities.dex.value;
        tok.abilities.int = TADD.abilities.int.value;
        tok.abilities.str = TADD.abilities.str.value;
        tok.abilities.wis = TADD.abilities.wis.value;
        
        tok.movement.burrow = TADD.attributes.movement.burrow;
        tok.movement.climb =  TADD.attributes.movement.climb;
        tok.movement.fly=     TADD.attributes.movement.fly;
        tok.movement.swim =   TADD.attributes.movement.swim;
        tok.movement.walk =   TADD.attributes.movement.walk;
    } else {
        tok.abilities.cha = TADD.originals.cha;
        tok.abilities.con = TADD.originals.con;
        tok.abilities.dex = TADD.originals.dex;
        tok.abilities.int = TADD.originals.int;
        tok.abilities.str = TADD.originals.str;
        tok.abilities.wis = TADD.originals.wis;
        
        tok.movement.burrow = TADD.originals.burrow;
        tok.movement.climb =  TADD.originals.climb;
        tok.movement.fly=     TADD.originals.fly;
        tok.movement.swim =   TADD.originals.swim;
        tok.movement.walk =   TADD.originals.walk;
    }
    tok.cr_new = tok.cr + opt.cr_change;
    if (tok.cr_new < 1){ tok.cr_new = 1; }
    tok.data_to_update[AD+"details.cr"] = tok.cr_new;
    tok.cr_change_since_orig = tok.cr_new - tok.originals.cr;
}
function gender_get(){
    return ["Male","Female"].random();
}
function is_humanoid(type){
    //console.log("is_humanoid: " + type);
    //if (["celestial","fey","fiend","giant","humanoid"].includes(type.toLowerCase()) || type.indexOf("umanoid")> -1){
    if (["celestial","fey","fiend","giant","humanoid"].includes(type.toLowerCase())){
        return true;
    } else {
        return false;
    }
}
async function item_types_remove(token, tok){
    for (let i of token.actor.items){
        console.log(i.name + " : " + i.type)
        if (tok.item_types_to_delete.includes(i.type)){
            tok.items_to_delete.push(i._id);
        }
    }
    await items_delete(token, tok.items_to_delete)
}
async function items_add(token, tok) {
    console.log(token);
    console.log(tok.items_to_add_compendium);
    console.log(tok.items_to_add_raw);

    //let entities = []
    for (let i of tok.items_to_add_compendium){
        let pack = await game.packs.get(i[0]);
        let index = await pack.getIndex();
        let entry = await index.find(e => e.name === i[1]);
        
        console.log(entry)
        
        let entity = await pack.getDocument(entry._id);
        //entities.push(entity.data.toObject());
        tok.items_to_add_raw.push(entity.data.toObject());
    }
    //console.log(entities);
    //await token.actor.createEmbeddedDocuments("Item", entities);
    
    console.log(tok);
    await token.actor.createEmbeddedDocuments("Item", tok.items_to_add_raw);
}
async function items_delete(token, items){
    await token.actor.deleteEmbeddedDocuments( "Item", items );
}
//token.actor.deleteEmbeddedDocuments("ActiveEffect", [effect.id]);

async function items_equip_all(token){
    for (let i of token.actor.items){
        if (i.type == "equipment" || i.type == "weapon"){
            await item_equipped_identified_proficient(token, i)
        }
    }
}

async function item_equipped_identified_proficient(token, item){
    await token.actor.updateEmbeddedDocuments("Item", [{
        _id:item.id, 
        data:{
            equipped: true,
            identified: true,
            proficient: true
        }
        }]
    );
}

async function items_update(token, updates){
    console.log(updates);
    await token.actor.updateEmbeddedDocuments("Item", updates);
}

function npc_count_get(){
    let npc_count = 0;
    for (let t of canvas.tokens.controlled){
        npc_count++;
    }
    return npc_count;
}
function party_level_average_get(){
    let party_count = 0;
    let party_level_total = 0;
    //console.log(canvas.tokens.placeables)
    for (let t of canvas.tokens.placeables){
        if (t.actor){
            let a = game.actors.get(t.actor.id);
            if (a.data.type){
                if (a.data.type != "npc"){
                    party_count++;
                    for (const [key, value] of Object.entries(a.data.data.classes)) {
                        party_level_total += value.levels;
                    }
                }
            }
        }
    }
    return Math.round(party_level_total / party_count);
}

function roll_bell_curve_1000(){
    let roll = roll_simple(1000);
    switch(true){
        case (roll<5):   return 0.25; //1-4         4/1000   =  0.4%
        case (roll<21):  return 0.50; //5-20        16/1000  =  1.6%
        case (roll<161): return 0.75; //21-160      140/1000 = 14.0%
        case (roll<841): return 1.00; //161-840     680/1000 = 68.0%
        case (roll<981): return 1.50; //861-980     140/1000 = 14.0%
        case (roll<997): return 2.00; //981-996     16/1000  =  1.6%
        default:         return 4.00; //997-1000    4/1000   =  0.4%
    }
}

function roll_simple(d){
    return Math.floor(Math.random() * d) + 1
}
function roll_no1_no2(qty, d){
    let total = 0;
    for (let i = 0; i < qty; i++){
        let r = Math.floor(Math.random() * d) + 1
        if (r < 3){ r = 3; }
        total = total + r;
    }
    return total;
}

async function spellslots_get(tok){
    let spellslots = [
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 2, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 3, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 4, 2, 0, 0, 0, 0, 0, 0, 0],
      [1, 4, 3, 0, 0, 0, 0, 0, 0, 0],
      [1, 4, 3, 2, 0, 0, 0, 0, 0, 0],
      [1, 4, 3, 3, 0, 0, 0, 0, 0, 0],
      [1, 4, 3, 3, 1, 0, 0, 0, 0, 0],
      [1, 4, 3, 3, 2, 0, 0, 0, 0, 0],
      [1, 4, 3, 3, 3, 1, 0, 0, 0, 0],
      [1, 4, 3, 3, 3, 2, 0, 0, 0, 0],
      [1, 4, 3, 3, 3, 2, 1, 0, 0, 0],
      [1, 4, 3, 3, 3, 2, 1, 0, 0, 0],
      [1, 4, 3, 3, 3, 2, 1, 1, 0, 0],
      [1, 4, 3, 3, 3, 2, 1, 1, 0, 0],
      [1, 4, 3, 3, 3, 2, 1, 1, 1, 0],
      [1, 4, 3, 3, 3, 2, 1, 1, 1, 0],
      [1, 4, 3, 3, 3, 2, 1, 1, 1, 1],
      [1, 4, 3, 3, 3, 3, 1, 1, 1, 1],
      [1, 4, 3, 3, 3, 3, 2, 1, 1, 1],
      [1, 4, 3, 3, 3, 3, 2, 2, 1, 1]
    ];

    //Add all spells per level
    /*
    let all_spells = [];
    let cr = tok.cr_new;
    if (cr > 20){ cr = 20;};
    for (let i=0; i<10; i++){
        let spell_count = spell_count_by_level[cr][i];
        console.log("i: " + i + ", Spell_Count: " + spell_count)
        if (spell_count > 0){
            let spell_list = tok.template.spell_list[i];
            //console.log(spell_list)
            for (let spell of spell_list){
                //console.log(spell)
                //all_spells.push(spell)
                all_spells.push(spell);
            }
        }
    }
    */
    return spellslots[tok.cr_new];
}

function spell_level_get_max(cr){
    let l = 0;
    if (cr >0) l = 1;
    if (cr >2) l = 2;
    if (cr >4) l = 3;
    if (cr >6) l = 4;
    if (cr >8) l = 5;
    if (cr >10) l = 6;
    if (cr >12) l = 7;
    if (cr >14) l = 8;
    if (cr >16) l = 9;
    return l;
}
function social_status_get(token,tok){
    let roll = roll_simple(1000);
    tok.social_status_before = roll;
    roll += (token.actor.data.data.abilities.cha.mod * 20)
    tok.social_status_after = roll;
    switch(true){
        case (roll<5):   return 0.25; //1-4         4/1000   =  0.4%
        case (roll<21):  return 0.50; //5-20        16/1000  =  1.6%
        case (roll<161): return 0.75; //21-160      140/1000 = 14.0%
        case (roll<841): return 1.00; //161-840     680/1000 = 68.0%
        case (roll<981): return 1.50; //861-980     140/1000 = 14.0%
        case (roll<997): return 2.00; //981-996     16/1000  =  1.6%
        default:         return 4.00; //997-1000    4/1000   =  0.4%
    }
}

async function template_choose(tok){
    let template = [];
    let type = tok.opt.template_str;
    //                 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 
    //let armor_plus  = [0,0,1,1,1,1,2,2,2,2,2,2,2,2,3,3,3,3,3,3,3];
    //let shield_plus = [0,0,0,0,0,0,1,1,1,1,1,1,2,2,2,2,2,2,2,2,3];
    //let weapon_plus = [0,0,0,0,1,1,1,1,2,2,2,2,2,2,2,2,2,2,3,3,3];

    template.armor_plus  = 0;
    template.shield_plus = 0;
    template.weapon_plus = 0;
    if (tok.adjusted_cr > 1){ template.armor_plus  = Math.round((tok.adjusted_cr /7)); }
    if (tok.adjusted_cr > 6){ template.shield_plus = Math.round((tok.adjusted_cr /7)); }
    if (tok.adjusted_cr > 4){ template.weapon_plus = Math.round((tok.adjusted_cr /7)); }
    
    //console.log(tok);

    //Even if "generic" was chosen, use some sense to figure out what kind of NPC we are dealing with
    if (tok.is_humanoid){
        //Figure out if npc can cast spells
        if (tok.spellcaster_type){
            if (tok.spellcaster_type == "wis"){
                template.class = "cleric";
            } else {
                template.class = "wizard";
            }            
        } else {
            template.class = "fighter";
        }
    } else {
        //Non-Humanoid
        template.class = "non-humanoid";
    }
    
    console.log("Template class: " + template.class);
    
    
    switch(template.class){
        case "cleric":
            template.class = "Cleric";
            template.abilities = ["con","dex","wis"];
            template.spell_list = [
                ["Light"],
                ["Cure Wounds","Healing Word","Inflict Wounds","Protection from Evil and Good","Sanctuary","Shield of Faith"],
                ["Aid","Blindness/Deafness","Hold Person","Lesser Restoration","Prayer of Healing","Silence","Spiritual Weapon"],
                ["Animate Dead","Bestow Curse","Dispel Magic","Glyph of Warding","Mass Healing Word","Magic Circle","Meld into Stone","Revivify","Water Walk"],
                ["Banishment","Control Water","Death Ward","Freedom of Movement","Guardian of Faith","Stone Shape"],
                ["Contagion","Dispel Evil and Good","Geas","Greater Restoration","Insect Plague","Mass Cure Wounds","Raise Dead"],
                ["Blade Barrier","Create Undead","Harm","Heal","Word of Recall"],
                ["Conjure Celestial","Divine Word","Etherealness","Fire Storm","Plane Shift","Regenerate","Resurrection"],
                ["Antimagic Field","Control Weather","Earthquake"],
                ["Gate","Mass Heal","True Resurrection"]
            ];
            template.weapons_1_handed = ["Battleaxe","Flail","Handaxe","Light Hammer","Longsword","Mace","Morningstar","Scimitar","Shortsword","Sickle","War Pick","Warhammer"];
            template.weapons_2_handed = ["Glaive","Greataxe", "Greatsword","Halberd","Maul","Pike","Spear","Trident"];
            template.weapons_1_handed_range = ["Hand Crossbow"];
            template.weapons_2_handed_range = ["Light Crossbow","Shortbow"];
            break;
        case "fighter":
            template.class = "Fighter";
            template.abilities = ["dex","wis","str"];
            template.spell_list= [];
            template.weapons_1_handed = ["Battleaxe","Flail","Handaxe","Light Hammer","Longsword","Mace","Morningstar","Rapier","Scimitar","Shortsword","Sickle","War Pick","Warhammer","Whip"];
            template.weapons_2_handed = ["Glaive","Greataxe", "Greatsword","Halberd","Maul","Pike","Spear","Trident"];
            template.weapons_1_handed_range = ["Blowgun","Hand Crossbow","Shortbow","Sling"];
            template.weapons_2_handed_range = ["Heavy Crossbow","Javelin","Longbow","Light Crossbow"];
            break;
        case "non-humanoid":
            template.class = "Non-Humanoid";
            template.abilities = ["con","dex","str"];
            template.spell_list= [];
            break;
        case "wizard":
            template.class = "Wizard";
            template.abilities = ["con","dex","int"];
            template.spell_list = [
                ["Chill Touch","Poison Spray","Ray of Frost"],
                ["Burning Hands","Feather Fall","Mage Armor","Magic Missile","Sleep"],
                ["Darkness","Detect Thoughts","Hold Person","Invisibility","Knock","Ray of Enfeeblement","Scorching Ray","See Invisibility","Spider Climb","Web","Levitate"],
                ["Animate Dead","Dispel Magic","Fear","Fireball","Fly","Haste","Lightning Bolt","Slow","Vampiric Touch"],
                ["Banishment","Black Tentacles","Greater Invisibility","Ice Storm","Phantasmal Killer","Stoneskin","Wall of Fire"],
                ["Cloudkill","Cone of Cold","Dominate Person","Teleportation Circle","Wall of Force"],
                ["Chain Lightning","Circle of Death","Disintegrate", "Globe of Invulnerability"],
                ["Finger of Death","Plane Shift","Reverse Gravity","Teleport"],
                ["Mind Blank","Maze","Power Word Stun"],
                ["Imprisonment","Meteor Swarm","Power Word Kill"]
            ];
            template.weapons_1_handed = ["Dagger","Dart"];
            template.weapons_2_handed = ["Quarterstaff"];
            template.weapons_1_handed_range = ["Dart"];
            template.weapons_2_handed_range = [];
            break;
    }
    //console.log(template);
    return template;
}

async function token_update(token, tok){
    await token.document.update(tok.data_to_update);
}

function treasure_generate(tok){
    //Decide how to break up remaining wealth into different items
    //  Coins vs misc
    
    let items = [];
    
    //Return items
}

async function weapon_melee_get(tok){
    let weapon_m = [];
    weapon_m.push("Dagger");
    weapon_m.push("Greatsword");
    weapon_m.push("Longsword");
    weapon_m.push("Mace");
    weapon_m.push("Shortsword");
    weapon_m.push("Greataxe");
    weapon_m.push("Battleaxe");
    weapon_m.push("Handaxe");
    weapon_m.push("Maul");
    weapon_m.push("Spear");
    weapon_m.push("Scimitar");
    weapon_m.push("Flail");
    weapon_m.push("Quarterstaff");
    weapon_m.push("Glaive");
    weapon_m.push("Halberd");
    weapon_m.push("Lance");
    weapon_m.push("Light Hammer");
    weapon_m.push("Morningstar");
    weapon_m.push("Pike");
    weapon_m.push("Rapier");
    weapon_m.push("Sickle");
    weapon_m.push("Trident");
    weapon_m.push("War Pick");
    weapon_m.push("Warhammer");
    weapon_m.push("Whip");
    let weapon_melee_number = roll_simple(25) - 1;
    //Add a plus to the weapons
    let weapon_plus = Math.round(tok.cr_new / 4);
    let weapon_plus_str = "";
    if (weapon_plus == 0){
        weapon_plus_str = weapon_m[weapon_melee_number];
    } else if (weapon_plus > 3){
        weapon_plus_str = weapon_m[weapon_melee_number] + " +3";
    } else {
        weapon_plus_str = weapon_m[weapon_melee_number] + " +" + weapon_plus;
    }
    return weapon_plus_str;
}
async function weapon_range_get(tok){
    let weapon_r = [];
    weapon_r.push("Blowgun");
    weapon_r.push("Dart");
    weapon_r.push("Javelin");
    weapon_r.push("Spear");
    weapon_r.push("Sling");
    weapon_r.push("Shortbow");
    weapon_r.push("Longbow");
    weapon_r.push("Heavy Crossbow");
    weapon_r.push("Hand Crossbow");
    weapon_r.push("Light Crossbow");
    let weapon_range_number = roll_simple(10) - 1;
    //Add a plus to the weapons
    let weapon_plus = Math.round(tok.cr_new / 4);
    let weapon_plus_str = "";
    if (weapon_plus == 0){
        weapon_plus_str = weapon_r[weapon_range_number];
    } else if (weapon_plus > 3){
        weapon_plus_str = weapon_r[weapon_range_number] + " +3";
    } else {
        weapon_plus_str = weapon_r[weapon_range_number] + " +" + weapon_plus;
    }
    return weapon_plus_str;
}
function experience_points_get(cr){
    let xp = Array(0,200,450,700,1100,1800,2300,2900,3900,5000,5900,7200,8400,10000,11500,13000,15000,18000,20000,22000,25000);
    return xp[cr];
}
//================================== Dialogs ==================================
function dialog_start(){
    console.log("dialog_start");
    
    //Read in templates
    //let t_html = '<option value="world.mj-template-generic" selected>Generic</option>';
    let t_html = `<option value="mj-template-generic" selected>MJ Template - Generic</option>`
    for (let pack of game.packs){
        let label = pack.metadata.label;
        let val = pack.metadata.package + "." + pack.metadata.name;
        if (label.indexOf("MJ Template")>-1 && label != "MJ Template - Generic"){
            t_html += `<option value="` + val + `">` + label + `</option>`
        }
    }
    
    
    let d = new Dialog({
        title: "NPC Upgrade Options",
        content: `
            <form>
                <div class="form-group">
                    <label>Adjust NPC CR:</label>
                    <select id="scale-npc-cr" name="scale-npc-cr">
                        <option value="-10">-10</option>
                        <option value="-9">-9 </option>
                        <option value="-8">-8</option>
                        <option value="-7">-7</option>
                        <option value="-6">-6</option>
                        <option value="-5">-5</option>
                        <option value="-4">-4</option>
                        <option value="-3">-3</option>
                        <option value="-2">-2</option>
                        <option value="-1">-1</option>
                        <option value="0" selected>0</option>
                        <option value="1">+1</option>
                        <option value="2">+2</option>
                        <option value="3">+3</option>
                        <option value="4">+4</option>
                        <option value="5">+5</option>
                        <option value="6">+6</option>
                        <option value="7">+7</option>
                        <option value="8">+8</option>
                        <option value="9">+9</option>
                        <option value="10">+10</option>
                    </select>
                </div>
                <hr>

                <!-- re-insert template chooser here-->

                <center><div>NPC Adjustments</div></center>
                <div class="form-group">    <label>Abilities:</label>     <input id='adjust_abilities' type='checkbox' checked /></div>
                <!--<div class="form-group">    <label>Age:</label>           <input id='adjust_age' type='checkbox' checked /></div>-->
                <div class="form-group">    <label>Armor:</label>         <input id='adjust_armor' type='checkbox' checked /></div>
                <div class="form-group">    <label>HP:</label>            <input id='adjust_hp' type='checkbox' checked /></div>
                <div class="form-group">    <label>Movement:</label>      <input id='adjust_movement' type='checkbox' checked /></div>
                <!--<div class="form-group">    <label>Size:</label>          <input id='adjust_size' type='checkbox' checked /></div>-->
                <div class="form-group">    <label>Spells:</label>        <input id='adjust_spells' type='checkbox' checked /></div>
                <div class="form-group">    <label>Weapons:</label>       <input id='adjust_weapons' type='checkbox' checked /></div>
                <hr>
                <center><div>Clear Current</div></center>
                <div class="form-group">    <label>Armor:</label>   <input id='armor_clear' type='checkbox' checked /></div>
                <div class="form-group">    <label>Features:</label><input id='feature_clear' type='checkbox' checked /></div>
                <div class="form-group">    <label>Spells:</label>  <input id='spells_clear' type='checkbox' checked /></div>
                <div class="form-group">    <label>Weapons:</label> <input id='weapons_clear' type='checkbox' checked /></div>
            </form>
        `,
      buttons: {
        yes: {
          icon: "<i class='fas fa-check'></i>",
          label: "Upgrade",
          callback: () => {
              //Get all options from Form
              let opt = [];
              let e = document.getElementById("scale-npc-cr");
              opt.cr_change = parseInt(e.options[e.selectedIndex].value);
              
              //console.log("opt.cr_change: " + opt.cr_change);
              
              //e = document.getElementById("npc_template");
              //opt.template = e.options[e.selectedIndex].value;
              opt.template = "generic";

              opt.adjust_abilities = document.getElementById("adjust_abilities").checked
              //opt.adjust_ac        = document.getElementById("adjust_ac").checked
              opt.adjust_armor     = document.getElementById("adjust_armor").checked
              opt.adjust_hp        = document.getElementById("adjust_hp").checked
              opt.adjust_movement  = document.getElementById("adjust_movement").checked
              opt.adjust_spells    = document.getElementById("adjust_spells").checked
              opt.adjust_weapons   = document.getElementById("adjust_weapons").checked

              opt.clear_armor      = document.getElementById("armor_clear").checked
              opt.clear_features   = document.getElementById("armor_clear").checked
              opt.clear_spells     = document.getElementById("spells_clear").checked
              opt.clear_weapons    = document.getElementById("weapons_clear").checked

              main(opt);
          }
        },
        no: {
          icon: "<i class='fas fa-times'></i>",
          label: "Cancel"
        },
      },
      default: "yes"
    }).render(true);
    
    
    /* Template Chooser
                    <div class="form-group">
                    <label>Template:</label>
                    <select id="npc_template" name="npc_template">
                        ` + t_html + `
                    </select>
                </div>
                <hr>
    */
}

function log(group, logStr){
    console.group(group);
    console.log(logStr);
    console.groupEnd();
}
function l(logStr){
    console.log(logStr);
}

// Javascript Extensions:
Array.prototype.random = function () { return this[Math.floor((Math.random()*this.length))]; }


function get_test(tok){
    tok.get_test = true;
}