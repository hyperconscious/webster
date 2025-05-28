import { SelectQueryBuilder } from "typeorm";

let counter = 0;

export function applyCondition(
    qb: SelectQueryBuilder<any>,
    fieldName: string,
    operator: '=' | 'LIKE' | '>=' | '<=' | '<>' | 'IN',
    value: any
) {
    if (value === undefined || value === null) return;

    const upperOperator = operator.toUpperCase();

    const paramName = `param_${fieldName.replace('.', '_')}_${counter++}`;

    if (upperOperator === 'LIKE') {
        value = `%${value}%`;
        qb.andWhere(`${fieldName} LIKE :${paramName}`, { [paramName]: value });
    } else if (upperOperator === 'IN') {
        if (Array.isArray(value) && value.length) {
        qb.andWhere(`${fieldName} IN (:...${paramName})`, { [paramName]: value });
        }
    } else {
        qb.andWhere(`${fieldName} ${upperOperator} :${paramName}`, { [paramName]: value });
    }
}
