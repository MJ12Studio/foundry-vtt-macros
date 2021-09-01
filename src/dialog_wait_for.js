console.clear();
mjDialog("Choose Type", [["Yes",yes],["No",no]]);


function no(){
    console.log("no")
    document.getElementById("mjDialog").remove();
}
function yes(){
    console.log("yes");
    document.getElementById("mjDialog").remove();
}

function mjDialog (header, arr_text_fn) { 
    console.log("dialog2()", header, arr_text_fn);
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

    console.log("newDiv 1: ", newDiv.innerHTML)

    let count = 0;
    for (let text_fn of arr_text_fn){
        count++;
        newDiv.innerHTML += `<button id="btn` + count + `">` + text_fn[0] + `</button>`
    }
    //newDiv.innerHTML += `</div>`;
    document.body.appendChild(newDiv);

    console.log("newDiv 2: ", newDiv.innerHTML)

    //Add some event listeners
    count = 0;
    for (let text_fn of arr_text_fn){
        count++;
        let elem = document.getElementById("btn" + count);
        elem.onclick = text_fn[1];
    }
    
}
