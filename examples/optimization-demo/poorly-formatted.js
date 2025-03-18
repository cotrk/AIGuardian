/**
 * Example file with poor formatting for demonstration
 */
function badlyFormattedFunction(param1,param2,   param3)
{
    if(param1)
    {
        console.log("First parameter is true");
    for(let i=0;i<10;i++){
    console.log(i);
    if(i>5){console.log("Greater than 5");}
    }
    }
    else {
        console.log("First parameter is false");
        let result = param2 + 
        param3;
        return result;
    }
}

const complexObject = {name:"John",age:30,
    address:{
        street:"123 Main St",
city:"Anytown",
        state:"CA",
            zip:"12345"
    },
    contacts:[
        {type:"email",value:"john@example.com"},
    {type:"phone",
        value:"555-1234"}
    ]
};

function calculateValues(a,b,c)
{return a*b+c;}

// Inconsistent indentation
function inconsistentIndentation() {
  const value1 = 10;
    const value2 = 20;
        const value3 = 30;
    return value1 + value2 + value3;
}

// Missing semicolons
function missingSemicolons() {
  const a = 10
  const b = 20
  return a + b
}

// Export functions
module.exports = {
    badlyFormattedFunction,
    complexObject,
    calculateValues,
    inconsistentIndentation,
    missingSemicolons
}
