import mongoose from 'mongoose';

const { Schema } = mongoose;

const AgencySchema = new Schema(
    {
            company: { type: String, required: true },
            branch: { type: String, required: true },
            email: { type: String, required: true, unique: true },
            phone: { type: String, required: true },
            location: { type: String , required: true },
            code: { type: String , required: true },
            password: { type: String, required: true },
            initials:{type:String,required:true},
            packs: { type: Number, default: 0 },
            issuedPack: { type: Number, default: 0 },
            returnedPack: { type: Number, default: 0 },
            points: { type: Number, default: 0 },
            moneyBalance: { type: Number, default: 0 },
            emissionSaved: { type: Number, default: 0 },
            token:{type:String},
            imageUrl: { type: String,  },
            imagePublicId: { type: String,  },
            isVerified: { type: Boolean, default: false }, // Assuming isVerified is a boolean
            users: [{ type: Schema.Types.ObjectId, ref: 'User' }],
            vendors: [{ type: Schema.Types.ObjectId, ref: 'Vendor' }],
    },
    { timestamps: true }
);



const Agency = mongoose.model('Agency', AgencySchema);

export default Agency;
