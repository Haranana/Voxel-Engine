export function degreeToRadians(d: number){
    return d*Math.PI/180;
}

export type clampInput = {
    value: number;
    min?: number;
    max?: number
} 
export function clamp(input: clampInput) {
    if(input.min && input.max){
        return Math.max(input.min, Math.min(input.max, input.value));
    }else if(input.min){
        return Math.max(input.min, input.value);
    }else if(input.max){
        return Math.min(input.max, input.value);
    }else{
        return input.value;
    }

}

export function mod(n: number, m: number) {
  return ((n % m) + m) % m;
}