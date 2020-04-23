const getArg = (arg)=>{
    var io = process.argv.indexOf(arg);
    if(io<0)throw `You must provide the ${arg} argument.`;
    return process.argv[io+1];
}



module.exports = {getArg};