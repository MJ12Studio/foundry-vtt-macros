


//==================================== Constants ====================================
const EXPLOSION_BLUE = "modules/JB2A_DnD5e/Library/Generic/Explosion/Explosion_02_Blue_400x400.webm"

const IMG_SKELETON = "systems/dnd5e/tokens/undead/Skeleton.png"
const IMG_ZOMBIE =   "systems/dnd5e/tokens/undead/Zombie.png"

const SOUND_BZS =    "sounds/big-zombie-smash-sound-effect-24270630.ogg"

//===================================== Classes =====================================
class MJdialog{ 
    constructor(header, arr_text_fn){
        var newDiv = document.createElement("div");
        newDiv.id = "mjDialog";
        newDiv.style.position = "fixed";
        newDiv.style.left = "50%";
        newDiv.style.top = "50%";
        newDiv.style.transform = "translate(-50%, -50%)";
        newDiv.style.width = "300px";
        newDiv.style.zIndex = "999";
        newDiv.style.backgroundColor = "#fff";
        newDiv.style.border = "1px solid #ddd";
        newDiv.style.borderRadius = "5px";
        newDiv.style.boxShadow = "0 2px 8px #aaa";
        newDiv.style.padding = "10px";
        newDiv.innerHTML += `<div style="text-align:center;font-weight:bolder;">` + header + `</div><hr>`
        let count = 0;
        for (let text_fn of arr_text_fn){
            count++;
            newDiv.innerHTML += `<button id="btn` + count + `">` + text_fn[0] + `</button>`
        }
        document.body.appendChild(newDiv);
        //Add some event listeners
        count = 0;
        for (let text_fn of arr_text_fn){
            count++;
            let elem = document.getElementById("btn" + count);
            elem.onclick = text_fn[1];
        }
    }
    remove(){
        document.getElementById("mjDialog").remove();
    }
}
class MJnpc{
    constructor(){

    }
    async create(compendium, npc, location){
        this.x = location.x;
        this.y = location.y;
        let actor = await game.actors.getName(npc);
        if (!actor){
            //Load actor from compendium
            console.log("importing " + npc + " from compendium...");
            let pack = await game.packs.get(compendium);
            let index = await pack.getIndex();
            let entry = await index.find(e => e.name === npc);
            game.actors.importFromCompendium(compendium, entry._id)
            actor = game.actors.getName(npc);
        }
        let doc = {
            img: actor.data.img,
            x: location.x,
            y: location.y,
            vision: false,
            hidden: false,
            actorId: actor._id,
            actorLink: true,
            actorData: actor.data
        };
        let tok = await Token.create(doc);
        console.log("tok:", tok);
        this.width = tok[0].data.width;
        this.mjCreate = true;
    }

}
class MJtoken{
    constructor(token){
        this.actorData_updates = [];
        this.document = token.document;
        this.items_to_add_compendium = [];
        this.items_to_add_raw = [];
        this.items_to_remove = [];
        this.token = token;
        this.td = token.data;
        this.tadd = token.actor.data.data;
        //this.x = token.x;
        //this.y = token.y;
        //console.log("token: ", this.token);
        //console.log("tadd: ", this.td);
        //console.log("tadd: ", this.tadd);

        //console.log("update():", this.token.update);


    }
    ability_adjust(ability, adjust){
        //console.log("ability_adjust: " + ability + " : " + adjust);
        let current_value = this.tadd.abilities[ability].value;
        let new_value = current_value + adjust;
        if (new_value < 1){ new_value = 1; }
        this.ability_set(ability, new_value);
    }
    ability_set(ability, value){
        this.actorData_updates["actorData.data.abilities." + ability + ".value"] = value;
    }
    actor_type_set(value){
        this.actorData_updates["actorData.data.details.type.value"] = value;
    }
    condition_immunity_add(ci){
        let immunities = this.tadd.traits.ci.value;
        if (!immunities.includes(ci)){
            immunities.push(ci);
            this.actorData_updates["actorData.data.traits.ci.value"] = immunities;
        }
    }
    damage_immunity_add(di){
        let immunities = this.tadd.traits.di.value;
        if (!immunities.includes(di)){
            immunities.push(di);
            this.actorData_updates["actorData.data.traits.di.value"] = immunities;
        }
    }
    damage_resistance_add(dr){
        let resistances = this.tadd.traits.dr.value;
        if (!resistances.includes(dr)){
            resistances.push(dr);
            this.actorData_updates["actorData.data.traits.dr.value"] = resistances;
        }
    }
    damage_vulnerability_add(dv){
        let resistances = this.tadd.traits.dv.value;
        if (!resistances.includes(dv)){
            resistances.push(dv);
            this.actorData_updates["actorData.data.traits.dv.value"] = resistances;
        }
    }
    explosion(file, sound){
        //Check for module, return if not
        new Sequence()
        .sound(sound)
			.volume(1.0)
        .effect()
            .file(file)
            .atLocation(this.token)
            .scale(1.5)
            .gridSize(100)
            .randomRotation()
        .play()
    }
    img_set(img){
        this.actorData_updates["img"] = img;
        this.actorData_updates["actorData.img"] = img;
    }
    item_types_remove(arr_item_types){
        for (let item of this.token.actor.items){
            //console.log(i.name + " : " + i.type)
            if (arr_item_types.includes(item.type)){
                this.items_to_remove.push(item._id);
            }
        }
    }
    item_add_compendium(compendium, item){
        this.items_to_add_compendium.push([compendium, item]);
    }
    item_add_raw(item){

    }
    async items_add() {
        //Creates raw {items_to_add_raw} out of [items_to_add_compendium] and adds them to the token
        //console.log("items_to_add_compendium:", this.items_to_add_compendium);
        for (let i of this.items_to_add_compendium){
            //console.log("item: ", i);
            let pack = await game.packs.get(i[0][0]);
            let index = await pack.getIndex();
            let entry = await index.find(e => e.name === i[0][1]);
            let entity = await pack.getDocument(entry._id);
            this.items_to_add_raw.push(entity.data.toObject());
        }
        //console.log("items_to_add_raw: ", this.items_to_add_raw)

        //console.log("Adding items: actor.createED", this.token.actor)

        await this.token.actor.createEmbeddedDocuments("Item", this.items_to_add_raw);
        //await this.token.actor.addEmbeddedItems(this.items_to_add_raw);
    }
    movement_set(movement, value){
        this.actorData_updates["actorData.data.attributes.movement." + movement] = value;
    }
    name_append(str){
        let current_name = this.token.name;
        if (current_name.indexOf(str) == -1){
            this.actorData_updates["name"] = current_name + " " + str;
            this.actorData_updates["actorData.name"] = current_name + " " + str;
        }
    }
    sense_add(sense, range){
        this.actorData_updates["actorData.data.attributes.senses." + sense] = range;
    }
    sense_add_special(sense){
        this.actorData_updates["actorData.data.attributes.senses.special"] = sense;
    }
    senses_remove_all(){
        for (var sense of ["blindsight","darkvision","tremorsense","truesight"]){
            this.actorData_updates["actorData.data.attributes.senses." + sense] = 0;
        }
        this.actorData_updates["actorData.data.attributes.senses.special"] = "";
    }
    async update(){
        //console.log("update()");

        //console.log(this.actorData_updates);
        await this.token.update(this.actorData_updates);

        //console.log("Before deleteEmbeddedDocuments");
        //console.log("items_to_remove:", this.items_to_remove);
        await this.token.actor.deleteEmbeddedDocuments( "Item", this.items_to_remove );

        //console.log("before items_add()");
        await this.items_add();

        this.token.actor.longRest({ dialog: false });

        //console.log(this);
    }

}
class MJfx{
    static explosion(target, video, audio){
        //Correct for uncentered target created by MJnpc
        if (target.mjCreate){
            target.x += (target.width / 2) * 50;
            target.y += (target.width / 2) * 50;
        }
        //console.log("NPC.explosion:", target, video, audio);
        //Check for module, return if not
        new Sequence()
        .sound(audio)
			.volume(1.0)
        .effect()
            .file(video)
            .atLocation(target)
            .scale(1)
            .gridSize(100)
            .randomRotation()
        .play()
    }
}

//if (!canvas.tokens.controlled[0]?.actor) { ui.notifications.warn("No Token selected"); return; }

//======================================= Main ======================================
console.clear();
console.log("mjspells");
if (args == []){ ui.notifications.warn("Can't be run directly"); return; }
console.log("args: ", args);

//Caster
let caster = canvas.tokens.controlled[0];
//console.log("caster: ", caster);

//Targets
let targets = args[0].targets;
//console.log("targets:", targets);

//Get Spell
let spell = args[0].item.name.toLowerCase();
console.log("Spell:", spell);

switch(spell){
    case "animate dead":
        let dlg = new MJdialog("Choose Type", [["Skeleton",skeleton],["Zombie",zombie]]);
        function skeleton(){ animate_dead("Skeleton"); }
        function zombie(){   animate_dead("Zombie"); }
        async function animate_dead(name){
            dlg.remove();
            if (targets.length == 0){
                let location = [];
                location.x = caster.x;
                location.y = caster.y + 50;
                let target = new MJnpc();
                await target.create("dnd5e.monsters", name, location);
                //target.actor_type_set("Undead");
                MJfx.explosion(target, EXPLOSION_BLUE, SOUND_BZS);
            } else {
                for (let target of targets){
                    //console.log("target:", target);
                    let t = new MJtoken(target)
                    t.senses_remove_all();
                    if (name == "Zombie"){
                        t.ability_adjust("str",1);
                        t.ability_adjust("dex",-2);
                        t.ability_adjust("con",3);
                        t.ability_adjust("int",-4);
                        t.ability_adjust("wis",-2);
                        t.ability_adjust("dex",-3);
                        t.condition_immunity_add("poisoned");
                        t.img_set(IMG_ZOMBIE)
                        t.item_add_compendium(["dnd5e.monsterfeatures","Undead Fortitude"]);
                        t.movement_set("walk",20);
                        t.sense_add_special("passive perception 9");
                    } else {
                        t.ability_adjust("dex",2);
                        t.ability_adjust("con",2);
                        t.ability_adjust("int",-2);
                        t.ability_adjust("wis",-1);
                        t.ability_adjust("dex",-3);
                        t.damage_vulnerability_add("bludgeoning");
                        t.img_set(IMG_SKELETON)
                        t.movement_set("walk",30);
                        t.sense_add_special("passive perception 8");
                    }
                    t.actor_type_set("Undead");
                    t.damage_immunity_add("poison");
                    t.item_types_remove(["feat","spell"])
                    t.name_append("(Undead)");
                    t.sense_add("darkvision", 60);
                    t.update();
                    MJfx.explosion(target, EXPLOSION_BLUE, SOUND_BZS);
                }
                
            }
        }
        break;
    
}

