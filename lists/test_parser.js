<script>
     Array.prototype._1 = function(){
        let flattened = this.flat(Infinity);                                //https://www.techiedelight.com/recursively-flatten-nested-array-javascript/
        let rndItem = a=> a[rnd()*a.length|0];
        let rnd = ()=> crypto.getRandomValues(new Uint32Array(1))[0]/2**32; //crypto-strong:  https://stackoverflow.com/questions/4550505/getting-a-random-value-from-a-javascript-array
        return rndItem(flattened);
    }
    String.prototype.cut = function(){ return this.split(","); }

    //Find all of the [arrays] in the string
    console.log(build(" Pick a number = (numbers). Pick y/n = (Y,N)." ));
    console.log(build(" Was wearing a (jewelery_f) and a (jewelery_m). Age: (aged)." ));
    
    
    function build(str){
        let arr = [];
        arr["numbers"] = [1,2,3,4,[5,6,7,8,[9,10,11,12]]];
        arr["jewelery_m"]     = "amulet,arm band,bracelet,crown,earring,necklace,pin,ring".cut();;
        arr["jewelery_f"]     = [arr["jewelery_m"],"anklet","broach","circlet","earrings"];
        arr["aged"]           = "age-old,aged,ancient,antiquated,archaic,old,primeval,primordial,timeworn,venerable".cut();
        arr["colors"]         = "beige,black,blue,brown,crimson,cyan,gold,gray,green,indigo,khaki,lavender,magenta,maroon,olive,orange,pink,plum,purple,red,salmon,silver,teal,violet,white,yellow".cut();
        arr["condition_bad"]  = "banged-up,battered,broken,busted,cracked,crushed,damaged,decayed,defective,mangled,moldy,mossy,ruined,rusty,smashed".cut();
        arr["condition_good"] = "beautiful,exceptional,faultless,flawless,immaculate,impeccable,lustrous,new,perfect,polished,shiny,splendid,spotless,stellar,stunning,unblemished".cut();
        arr["size"]           = "gargantuan,huge,large,medium,small,tiny".cut();
        arr["treasure_type_small"] = "bowl,idol,religious symbol,statuette".cut();
        
        //Describing item
        /*
        ["from the,".cut()]
        ["fabled,legendary,ancient,lost,mythical,ruined,sunken".cut()];
        [location]
        "of"
        [name]
        
        //Huge generator list of name-parts:
            https://github.com/seiyria/fantastical/blob/master/src/generators/species.ts
            
            
        
        
        */

        while (str.indexOf("(") > -1){
            let result = str.match(/\(([^)]+)\)/) || [];
            result = result.map(function(i) {
                return i.match(/\(([^)]+)\)/);
            });
            //console.log(result);
            if (arr[result[0][1]]){
                //console.log("Found: " + result[1]);
                var lookup = arr[result[0][1]]._1();
            } else {
                //console.log("Not found: " + result[0][1]);
                var lookup_arr = result[0][1].split(",");
                var lookup = lookup_arr._1();
            }
            //console.log("   = " + lookup);
            str = str.replace(result[0][0], lookup)
            //console.log(str);  
        }
        return str;
        //Wish list is for embedded lists and specify multiples.
    }
    
    
    // To handle A vs An, use:  https://eamonnerbonne.github.io/a-vs-an/AvsAnDemo/AvsAn.js
    
    





</script>
