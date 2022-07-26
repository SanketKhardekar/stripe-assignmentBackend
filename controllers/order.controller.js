const Order= require("../schemas/order.schema");
const logger=require("../utils/logger.util");
//Controller to save order data in mongo db
const createOrder = async(customer, data)=>{
    const Items= JSON.parse(customer.metadata.cart);
    const order= new Order({
        userId: +customer.metadata.userId,
        customerName:customer.metadata.userName,
        customerId: data.customer,
        products: Items,
        total:data.amount_total,
        paymentStatus: data.payment_status,
    });
    try {
        await order.save();
        return   
    } catch (error) {
        logger.error(error.message);
        return
    }
}

module.exports=createOrder;