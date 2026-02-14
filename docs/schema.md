```json

Organization:{
	name: [required:"Organization name is required", minLength:2, maxLength:100, match:/^[a-zA-Z0-9\s\-&.,'()]+$/]
	description: [maxLength:1000]
	email: [required:"Organization email is required", maxLength:100, match:/^[^\s@]+@[^\s@]+\.[^\s@]+$/]
	phone: [required:"Organization phone is required", minLength:10, maxLength:15, match:/^(\+251\d{9}|0\d{9})$/]
	address: [required:"Organization address is required", minLength:5, maxLength:500]
	industry: [required:"Industry is required", enum:["Technology","Healthcare","Finance","Education","Retail","Manufacturing","Construction","Hospitality","Transportation","Real Estate","Agriculture","Energy","Telecommunications","Media","Entertainment","Legal","Consulting","Insurance","Automotive","Aerospace","Pharmaceutical","Food & Beverage","Government","Non-Profit"]]
	size: [required:"Organization size is required", enum:["Small","Medium","Large"]]
	logo.url: [match:/^https:\/\/res\.cloudinary\.com\/.+$/]
	logo.publicId: [maxLength:255]
	createdBy: [ref:"User"]
	isPlatformOrg: [default:false]
}

Department:{
	name: [required:"Department name is required", minLength:2, maxLength:100, match:/^[a-zA-Z0-9\s\-&.,'()]+$/]
	description: [required:"Department description is required", maxLength:500]
	organization: [required:"Organization is required", ref:"Organization"]
	manager: [ref:"User"]
	createdBy: [ref:"User"]
}

User:{
	firstName: [required:"First name is required", minLength:2, maxLength:50, match:/^[a-zA-Z\s\-']+$/]
	lastName: [required:"Last name is required", minLength:2, maxLength:50, match:/^[a-zA-Z\s\-']+$/]
	position: [required:"Position is required", minLength:2, maxLength:100, match:/^[a-zA-Z\s\-']+$/]
	email: [required:"Email is required", maxLength:100, match:/^[^\s@]+@[^\s@]+\.[^\s@]+$/]
	password: [required:"Password is required", minLength:8, maxLength:128, select:false]
	role: [required:"Role is required", enum:["SuperAdmin","Admin","Manager","User"], default:"User"]
	organization: [required:"Organization is required", ref:"Organization"]
	department: [required:"Department is required", ref:"Department"]
	isPlatformOrgUser: [default:false]
	isHod: [default:false]
	profilePicture.url: [match:/^https:\/\/res\.cloudinary\.com\/.+$/]
	profilePicture.publicId: [maxLength:255]
	skills: [maxCount:10, each:{skill:{maxLength:50}, percentage:{min:0, max:100}}]
	employeeId: [match:/^(?!0000)\d{4}$/]
	phone: [minLength:10, maxLength:15, match:/^(\+251\d{9}|0\d{9})$/]
	dateOfBirth: [validate:"not future"]
	joinedAt: [required:"Joined date is required", validate:"not future"]
	refreshToken: [select:false]
	refreshTokenExpiry: [select:false]
	passwordResetToken: [select:false]
	passwordResetExpiry: [select:false]
	lastLogin: [default:null]
}

Task (Base):{
	title: [required:"Project task title is required", minLength:3, maxLength:200]
	description: [required:"Task description is required", minLength:10, maxLength:5000]
	status: [required:"Task status is required", enum:["TODO","IN_PROGRESS","COMPLETED","PENDING"], default:"TODO"]
	priority: [required:"Task priority is required", enum:["LOW","MEDIUM","HIGH","URGENT"], default:"MEDIUM"]
	organization: [required:"Organization is required", ref:"Organization"]
	department: [required:"Department is required", ref:"Department"]
	createdBy: [required:"Created by user is required", ref:"User"]
	attachments: [ref:"Attachment"]
	watchers: [ref:"User", validate:"unique"]
	tags: [maxCount:5, each:{maxLength:50, lowercase:true}, validate:"unique case-insensitive"]
}

ProjectTask:{
	vendor: [required:"Vendor is required for project tasks", ref:"Vendor"]
	startDate: [required:"Start date is required for project tasks"]
	dueDate: [required:"Due date is required for project tasks", validate:"after startDate"]
}

AssignedTask:{
	assignees: [required:"At least one assignee is required", ref:"User", minCount:1, maxCount:50, validate:"unique"]
	startDate: [required:"Start date is required for assigned tasks"]
	dueDate: [required:"Due date is required for assigned tasks", validate:"after startDate"]
}

RoutineTask:{
	date: [required:"Date is required for routine tasks"]
	materials: [maxCount:20, each:{material:{required:"Material reference is required when adding materials", ref:"Material"}, quantity:{required:"Material quantity is required when adding materials", min:0}}, validate:"unique materials, all quantities > 0"]
}

TaskActivity:{
	activity: [required:"Activity description is required", minLength:2, maxLength:1000]
	parent: [required:"Parent reference is required", refPath:"parentModel"]
	parentModel: [required:"Parent model is required", enum:["Task (ProjectTask, AssignedTask)", "TaskActivity","TaskComment"]]
	createdBy: [required:"Created by user is required", ref:"User"]
	organization: [required:"Organization is required", ref:"Organization"]
	department: [required:"Department is required", ref:"Department"]
	materials: [maxCount:20, each:{material:{required:"Material reference is required when adding materials", ref:"Material"}, quantity:{required:"Material quantity is required when adding materials", min:0}}, validate:"unique materials, all quantities > 0"]
	attachments: [ref:"Attachment", maxCount:20]
}

TaskComment:{
	comment: [required:"Comment content is required", minLength:2, maxLength:2000]
	parent: [required:"Parent reference is required", refPath:"parentModel"]
	parentModel: [required:"Parent model is required", enum:["Task (ProjectTask, AssignedTask, RoutineTask)", "TaskActivity","TaskComment"]]
	mentions: [ref:"User", maxCount:20]
	createdBy: [required:"Created by user is required", ref:"User"]
	department: [required:"Department is required", ref:"Department"]
	organization: [required:"Organization is required", ref:"Organization"]
	depth: [min:0, max:5, default:0]
	attachments: [ref:"Attachment"]
}

Material:{
	name: [required:"Material name is required", minLength:2, maxLength:200]
	unit: [required:"Unit is required", minLength:1, maxLength:50]
	category: [required:"Category is required", enum:["Electrical","Mechanical","Plumbing","Hardware","Cleaning","Textiles","Consumables","Construction","Other"], default:"Other"]
	price: [min:0, default:0]
	organization: [required:"Organization is required", ref:"Organization"]
	department: [required:"Department is required", ref:"Department"]
	createdBy: [required:"Created by user is required", ref:"User"]
}

Vendor:{
	name: [required:"Vendor name is required", minLength:2, maxLength:200]
	email: [required:"Vendor email is required", maxLength:100, match:/^[^\s@]+@[^\s@]+\.[^\s@]+$/]
	phone: [required:"Vendor phone is required", minLength:10, maxLength:15, match:/^(\+251\d{9}|0\d{9})$/]
	organization: [required:"Organization is required", ref:"Organization"]
	createdBy: [required:"Created by user is required", ref:"User"]
	rating: [min:1, max:5, default:null]
	address: [maxLength:500]
}

Attachment:{
	filename: [required:"File name is required", minLength:1, maxLength:255]
	fileUrl: [required:"File URL is required", match:/^https:\/\/res\.cloudinary\.com\/[a-zA-Z0-9_-]+\/image\/upload\/v\d+\/[a-zA-Z0-9_-]+\.[a-zA-Z]+$/]
	fileType: [required:"File type is required", enum:["Image","Video","Document","Audio","Other"]]
	fileSize: [required:"File size is required", min:0, max:10485760]
	parent: [required:"Parent reference is required"]
	parentModel: [required:"Parent model is required", enum:["Task (ProjectTask, AssignedTask, RoutineTask)","TaskActivity","TaskComment"]]
	uploadedBy: [required:"Uploaded by user is required", ref:"User"]
	department: [required:"Department is required", ref:"Department"]
	organization: [required:"Organization is required", ref:"Organization"]
}

Notification:{
	title: [required:"Notification title is required", maxLength:200]
	message: [required:"Notification message is required", minLength:1, maxLength:500]
	entity: [refPath:"entityModel", default:null]
	entityModel: [enum:["Task (ProjectTask, AssignedTask, RoutineTask)","TaskActivity","TaskComment","User","Organization","Department","Material","Vendor"], default:null]
	organization: [required:"Organization is required", ref:"Organization"]
	department: [required:"Department is required", ref:"Department"]
	isRead: [default:false]
	expiresAt: [default:"Date.now + 30 days"]
}

```
