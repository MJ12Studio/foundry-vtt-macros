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
        * Implemented constants for easy tweaking of game settings
        * Add a button to just generate loot
        * Multiattacks for Humanoid NPCs
        * Shields
        * Pluses for Armor and Weapons needs tweaked to be more fair/random
        
        =============== Questions Unanswered ===============
        Q: Can we access external javascript data files (github, bitbucket) for lists, arrays?
        Q: Do we want to make our money on this project? OR drive traffic to something else, like adventure modules?
            * Adventure modules could be designed to work with NPC Adjust.
            * Maybe instead of Patreon for this we just sell Adventure modules that auto-scale
        Q: Can we have [semi-]permanent settings for our macros?

        
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

        * Add a chat message to indicate token was scaled

        *** Add a help button on the start dialog to popup a help dialog.
    
        * Add a checkbox that is unchecked by default for "Allow exceed 5e SRD rules" <-- something like this...




        * Non-Human NPCs            
            Intelligent
                vs
            Non-Intelligent        
                No spells

      * Add debug option / info
      
      
      ================ Tweaking for release ==========================
      
      

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
    
    * Misc Magic Items
        Compendium necessary?

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
    
    * Simple macro to work with selected tokens
        * Show info, clear items, etc.
    
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

//Constants for tweaking scale settings
const ABILITY_LEVEL_PER_PLUS = 3;
const GEM_BASE_PERCENT = 50;
const LEVEL_PER_PLUS_ARMOR = 7;
const LEVEL_PER_PLUS_SHIELD = 7;
const LEVEL_PER_PLUS_WEAPON = 7;
const NPC_HIT_DIE = 12;

if (canvas.tokens.controlled.length == 0){ alert("Please select at least one NPC!"); return;}

dialog_start();
async function main(opt){
    opt.npc_count = await npc_count_get();
    opt.party_level_average = await party_level_average_get()


    for (let token of canvas.tokens.controlled){    //Loop through all selected tokens
        if (token.actor.type != "npc"){ continue; } //Skip it if it's not an npc

        let AD   = "actorData.data.";                       //Used for WRITING data to token. Foundry Data
        let TADD = token.actor.data.data;                   //Used for READING data from token. Foundry Data

        //Setup temp array for processing current token
        let tad  = [];
        tad.item_types_to_delete = [];
        tad.items_to_add_compendium = [];
        tad.items_to_add_raw = [];
        tad.items_to_delete = [];
        tad.movement = [];
        tad.opt = opt;

        //Get/set original data
        let original_actorData = TADD.original_actorData;
        let actorData_updates = [];
        if (!original_actorData){
            original_actorData = await token.actor.data;
            actorData_updates["actorData.data.original_actorData"] = original_actorData;
        }

        //Scale basic token info
        console.log("opt.cr_change: " + tad.opt.cr_change);
        console.log("original cr: " + original_actorData.data.details.cr)
        
        tad.cr = TADD.details.cr;
        if (tad.cr < 1){ tad.cr = 1; }
        tad.cr_new = tad.cr + tad.opt.cr_change;
        if (tad.cr_new < 1){ tad.cr_new = 1; }
        actorData_updates[AD+"details.cr"] = tad.cr_new;
        tad.cr_change_since_orig = Math.round(tad.cr_new - original_actorData.data.details.cr);

        //Misc Token info
        tad.alignment = TADD.details.alignment;
        tad.gender = gender_get();
        tad.race = TADD.details.race;
        tad.is_humanoid = is_humanoid(TADD.details.type.value);
        tad.max_spell_level = spell_level_get_max(tad.cr_new);
        tad.spellcaster_type = TADD.attributes.spellcasting;

        //Social Status, Luck
        tad.social_status = social_status_get(token,tad);
        tad.luck = roll_bell_curve_1000();
        tad.xp = experience_points_get(tad.cr_new);
        tad.adjusted_cr = Math.round(tad.cr_new * tad.social_status * tad.luck);    //Rounds up if >= 0.5

        //Read in template
        tad.template = await template_choose(tad);

        //Abilities Adjust
        if (tad.opt.adjust_abilities){
            tad.con = original_actorData.data.abilities.con.value;
            for (let ability of tad.template.abilities){
                let new_value = original_actorData.data.abilities[ability].value + Math.round(tad.cr_change_since_orig/ABILITY_LEVEL_PER_PLUS);
                actorData_updates[AD+"abilities." + ability + ".value"] = new_value;
                if (ability == "con"){ tad.con = new_value; }
            }
        }

        //Clear AC Flat Value
        actorData_updates[AD+"attributes.ac.flat"] = null;

        //HP Adjust
        if (opt.adjust_hp){
            let hp = TADD.attributes.hp.max;
            tad.hp = (tad.cr_new * NPC_HIT_DIE) + (parseInt((tad.con - 10) / 2) * tad.cr_new);
            actorData_updates[AD+"attributes.hp.max"] = tad.hp;
        }

        //Do some things based on humanoid/non-humanoid
        if (!tad.is_humanoid){
            //Movement Adjust: Adjust up or down by 1 foot per CR 
            for (let m of ["burrow","climb","fly","swim","walk"]){
                console.log(original_actorData);
                let cur_m = original_actorData.data.attributes.movement[m];
                if (cur_m > 0){
                    tad.movement[m] = Math.round(cur_m + tad.cr_new);
                    actorData_updates[AD+"attributes.movement." + m] = tad.movement[m];
                }
            }
        } else {
            console.log("Is Humanoid");
            if (tad.opt.clear_armor){    tad.item_types_to_delete.push("equipment"); }
            if (tad.opt.clear_spells){   tad.item_types_to_delete.push("spell"); }
            if (tad.opt.clear_weapons){  tad.item_types_to_delete.push("weapon"); }
        }

        //Items Adjust
        tad.has_multiattack = false;
        tad.has_shield = false;
        for (let item of token.actor.items){
            
            //console.log("item: " + item.name);
            //console.log(item);
            //console.log("is_humanoid: " + tok.is_humanoid)
            if (tad.is_humanoid){
                //console.log("   isHumanoid!");
                //Weapons / Armor
                if (item.type === "weapon"){
                    //console.log("   weapon")
                    let new_name = "";
                    let weapon_plus = await item_plus_get(tad);
                    l("Weapon_plus: " + weapon_plus);
                    if (weapon_plus > 0){
                        new_name = " +" + weapon_plus;                        
                    }
                    let weapon = "";
                    if (item.data.data.properties.two){
                        //console.log("   two-handed weapon")
                        if (item.name.indexOf("bow") > -1){
                            //console.log("   bow")
                            //Add a bow
                            let n = tad.template.weapons_2_handed_range.length;
                            let r = roll_simple(n)-1;
                            weapon = tad.template.weapons_2_handed_range[r];
                        } else {
                            //console.log("   non-range weapon")
                            //Add a hand weapon
                            let n = tad.template.weapons_2_handed.length;
                            let r = roll_simple(n)-1;
                            weapon = tad.template.weapons_2_handed[r];
                        }
                    } else {
                        //console.log("   one-handed weapon")
                        if (item.data.data.properties.amm || item.data.data.properties.thrown){
                            //Add a ranged one-handed weapon
                            //console.log(tok.template.weapons_1_handed_range)
                            //console.log(tok);
                            let n = tad.template.weapons_1_handed_range.length;
                            let r = roll_simple(n)-1;
                            weapon = tad.template.weapons_1_handed_range[r];
                        } else {
                            //Add a non-ranged one handed weapon
                            //console.log(tok.template.weapons_1_handed)
                            //console.log(tok);
                            let n = tad.template.weapons_1_handed.length;
                            let r = roll_simple(n)-1;
                            weapon = tad.template.weapons_1_handed[r];                            
                            
                            //Add a shield?
                            if (tad.template.class == "Fighter"){
                                tad.has_shield = true;
                            }
                            
                            
                        }
                    }
                    new_name = weapon + new_name;
                    //console.log("Trying to add weapon: " + new_name);
                    tad.items_to_add_compendium.push(["dnd5e.items", new_name])
                } else if (item.type === "feat"){
                    if (item.name == "Multiattack"){
                        tad.has_multiattack = true;
                    }
                    if (item.name.indexOf("Multiattack (") > -1){
                        //Remove our versions of Multiattacks
                        //console.log(item);
                        await token.actor.deleteEmbeddedDocuments( "Item", [item.id] );
                    }
                } else {
                    console.log(item);
                    log("Armor", item.data.data.armor)
                    if (item.data.data.armor && !item.name.indexOf("Shield")){
                        let armor_plus_str = await armor_get(tad);
                        tad.items_to_add_compendium.push(["dnd5e.items", armor_plus_str])
                    }
                }
                
            } else {
                //console.log("Non-Humanoid");
                if (item.type === "weapon"){
                    tad.items_updates = [];
                    let original_damage = item.data.data.original_damage;
                    //console.log("Original original_damage: " + original_damage);
                    if (!original_damage){
                        //console.log("NO original_damage")
                        tad.items_updates.push({
                            _id:item.id,
                            data: {
                                original_damage: item.data.data.damage.parts[0][0]
                            }
                        });
                        original_damage = item.data.data.damage.parts[0][0];
                    } else {
                        //original_damage = item.data.data.damage.parts[0][0];
                    }
                    //console.log("Original Damage: " + original_damage);

                    let dPos = original_damage.indexOf("d");
                    let d = parseInt(original_damage.substr(0,dPos));
                    if (d > 0){
                        //console.log("D: " + d);
                        let newD = d + Math.round(tad.cr_change_since_orig/2);
                        //console.log("newD: " + newD);
                        if (d + newD < 0){ newD = 1; }
                        let new_damage = newD + original_damage.substr(dPos,1000);
                        //console.log("new_damage: " + new_damage);
                        let damage_type = item.data.data.damage.parts[0][1]
                        let data = item.data.data;
                        //console.log(data);
                        data.damage.parts[0][0] = new_damage;
                        data.damage.parts[0][1] = damage_type;
                        tad.items_updates.push({
                            _id:item.id,
                            data: data
                        });
                    }
                    await token.actor.updateEmbeddedDocuments("Item", tad.items_updates);
                }
            }
            
        }
        
        //Has Shield?
        if (tad.has_shield){
            let shield_plus = await item_plus_get(tad);
            l("shield_plus: " + shield_plus);
            if (shield_plus > 0){
                tad.shield_name = "Shield +" + shield_plus;
            } else {
                tad.shield_name = "Shield";
            }
            tad.items_to_add_compendium.push(["dnd5e.items", tad.shield_name])
        }

        //Does multi-Attack need added?
        if (tad.is_humanoid){
            if (!tad.has_multiattack){
                if (tad.cr_new > 2){
                    if (tad.cr_new > 11){
                        tad.items_to_add_raw.push({
                            name: "Multiattack (3 Attacks)",
                            type: "feat",
                            data: {
                                description: {
                                    value: "The NPC gets 3 melee attacks."
                                }
                            }
                        });
                    } else {
                        tad.items_to_add_raw.push({
                            name: "Multiattack (2 Attacks)",
                            type: "feat",
                            data: {
                                description: {
                                    value: "The NPC gets 2 melee attacks."
                                }
                            }
                        });
                        
                    }
                }
            }
        }
        
        //Add spells for spellcasters
        if (tad.spellcaster_type){
            for (let level = 1; level <= tad.max_spell_level; level++){
                for (let spell of tad.template.spell_list[level]){
                    tad.items_to_add_compendium.push(["dnd5e.spells", spell]);
                }
            }
            actorData_updates[AD+"details.spellLevel"] = tad.cr_new;
        }
        
        //Add coins, treasure
        if (tad.opt.adjust_loot){
            tad.item_types_to_delete.push("loot");
            loot_get(tad);
        }

        await token.document.update(actorData_updates);
        await item_types_remove(token, tad);                //Remove all selected item types
        await items_add(token, tad);                        //Add all items
        await items_equip_all(token);                       //Equip, identify, make proficient all items
        //await token.document.update(tok.data_to_update);    //Update all token data at once!
        await token.actor.longRest({ dialog: false });      //Refresh spellslots and hp

        console.log(tad);
        console.log(original_actorData)
        console.log(token.actor);
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
async function armor_get(tad){
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
    
    //console.log(tad);
    if (tad.adjusted_cr > 12){ tad.adjusted_cr = 12; }
    if (tad.adjusted_cr > 0 && tad.adjusted_cr < 5){ armor_number = roll_simple(4); }
    if (tad.adjusted_cr > 4 && tad.adjusted_cr < 10){ armor_number = roll_simple(4) + 4; }
    if (tad.adjusted_cr >= 10){                  armor_number = roll_simple(4) + 8; }
    
    let armor_plus = await item_plus_get(tad);
    l("armor_plus: " + armor_plus);
    if (armor_plus > 0){
        return armor[armor_number] + " +" + armor_plus;
    } else {
        return armor[armor_number];
    }
}
function gender_get(){
    return ["Male","Female"].random();
}
function is_humanoid(type){
    if (["celestial","fey","fiend","giant","humanoid"].includes(type.toLowerCase())){
        return true;
    } else {
        return false;
    }
}
async function item_plus_get(tad){
    //l("tad.adjusted_cr: " + tad.adjusted_cr);
    let roll = roll_simple(100);
    //l(" Roll = " + roll)
    switch(true){
        case (tad.adjusted_cr < 8):
            let percent_a = Math.round((tad.adjusted_cr / 7) * 100);
            //l(" percent_a: " + percent_a);
            if(roll <= percent_a){ return 1; } else { return 0; }
            break;
        case (tad.adjusted_cr < 15):
            let percent_s = Math.round(((tad.adjusted_cr - 7) / 7) * 100);
            //l(" percent_s: " + percent_s);
            if(roll <= percent_s){ return 2; } else { return (roll_simple(2)-1); }
            break;
        default:
            let percent_w = Math.round(((tad.adjusted_cr - 14) / 6) * 100);
            //l(" percent_w: " + percent_w);
            if(roll <= percent_w){ return 3; } else { return (roll_simple(3)-1); }
    }
}
async function item_types_remove(token, tad){
    for (let i of token.actor.items){
        //console.log(i.name + " : " + i.type)
        if (tad.item_types_to_delete.includes(i.type)){
            tad.items_to_delete.push(i._id);
        }
    }
    await items_delete(token, tad.items_to_delete)
}
async function items_add(token, tad) {
    console.log(tad.items_to_add_compendium)
    for (let i of tad.items_to_add_compendium){
        let pack = await game.packs.get(i[0]);
        let index = await pack.getIndex();
        let entry = await index.find(e => e.name === i[1]);
        let entity = await pack.getDocument(entry._id);
        tad.items_to_add_raw.push(entity.data.toObject());
    }
    await token.actor.createEmbeddedDocuments("Item", tad.items_to_add_raw);
}
async function items_delete(token, items){
    await token.actor.deleteEmbeddedDocuments( "Item", items );
}
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
async function loot_get(tad){
    tad.base_gp = Math.round((Math.round(tad.xp/10) * tad.social_status * tad.luck) + roll_simple(tad.adjusted_cr));
    let gem_percent = GEM_BASE_PERCENT + roll_simple((100 - GEM_BASE_PERCENT));
    let gem_value = Math.round(tad.base_gp * (gem_percent/100));
    let gem_qty = roll_simple(tad.cr_new);
    let gp_value = tad.base_gp - gem_value;
    if (gem_value > 0){
        tad.items_to_add_raw.push({
            name: "Ancient Necklace",
            type: "loot",
            data: {
                quantity: gem_qty,
                price: gem_value,
            }
        });
    }
    if (gp_value > 0){
        tad.items_to_add_raw.push({
            name: "Gold Pieces (" + gp_value + ")",
            type: "loot",
            data: {
                quantity: gp_value,
                price: gp_value,
            },
        });
    }
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
function social_status_get(token,tad){
    let roll = roll_simple(1000);
    tad.social_status_before = roll;
    roll += (token.actor.data.data.abilities.cha.mod * 20)
    tad.social_status_after = roll;
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
async function template_choose(tad){
    let template = [];
    let type = tad.opt.template_str;
    

    
    /*
    template.armor_plus  = 0;
    template.shield_plus = 0;
    template.weapon_plus = 0;
    if (tad.adjusted_cr > 1){ template.armor_plus  = Math.round((tad.adjusted_cr /LEVEL_PER_PLUS_ARMOR)); }
    if (tad.adjusted_cr > 6){ template.shield_plus = Math.round((tad.adjusted_cr /LEVEL_PER_PLUS_SHIELD)); }
    if (tad.adjusted_cr > 4){ template.weapon_plus = Math.round((tad.adjusted_cr /LEVEL_PER_PLUS_WEAPON)); }

    if (template.armor_plus > 3){ template.armor_plus = 3; }
    if (template.shield_plus > 3){ template.shield_plus = 3; }
    if (template.weapon_plus > 3){ template.weapon_plus = 3; }
    */
    
    //console.log(tok);

    //Even if "generic" was chosen, use some sense to figure out what kind of NPC we are dealing with
    if (tad.is_humanoid){
        //Figure out if npc can cast spells
        if (tad.spellcaster_type){
            if (tad.spellcaster_type == "wis"){
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
                <!--<div class="form-group">    <label>Age:</label>       <input id='adjust_age' type='checkbox' checked /></div>-->
                <div class="form-group">    <label>Armor:</label>         <input id='adjust_armor' type='checkbox' checked /></div>
                <div class="form-group">    <label>HP:</label>            <input id='adjust_hp' type='checkbox' checked /></div>
                <div class="form-group">    <label>Loot:</label>          <input id='adjust_loot' type='checkbox' checked /></div>
                <div class="form-group">    <label>Movement:</label>      <input id='adjust_movement' type='checkbox' checked /></div>
                <!--<div class="form-group">    <label>Size:</label>      <input id='adjust_size' type='checkbox' checked /></div>-->
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
        upgrade: {
          icon: "<i class='fas fa-check'></i>",
          label: "Full Upgrade",
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
              opt.adjust_loot      = document.getElementById("adjust_loot").checked
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
        loot: {
            icon: "<i class='fas fa-check'></i>",
            label: "Loot Only",
            callback: () => {
                let opt = [];
                opt.cr_change = 0;
                opt.adjust_armor = false;
                opt.adjust_hp = false;
                opt.adjust_loot = true;
                opt.adjust_movement = false;
                opt.adjust_spells = false
                opt.adjust_weapons = false;
                opt.clear_armor = false;
                opt.clear_features = false;
                opt.clear_spells = false;
                opt.clear_weapons = false;
                main(opt);
            }
        },
        cancel: {
          icon: "<i class='fas fa-times'></i>",
          label: "Cancel"
        },
      },
      default: "yes"
    }).render(true);
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