from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime

class ProfileBase(BaseModel):
    institution: Optional[str] = Field(None, max_length=200)
    course: Optional[str] = Field(None, max_length=150)
    department: Optional[str] = Field(None, max_length=150)
    skills: List[str] = Field(default_factory=list)
    interests: List[str] = Field(default_factory=list)
    innovation_domains: List[str] = Field(default_factory=list)
    bio: Optional[str] = Field(None, max_length=1000)
    avatar_url: Optional[str] = Field(None, max_length=500)

class ProfileCreate(ProfileBase):
    pass

class ProfileUpdate(ProfileBase):
    pass

class ProfileResponse(ProfileBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class UserBase(BaseModel):
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=100)
    role: Optional[str] = Field("student", pattern="^(student|mentor|admin)$")

class UserCreate(UserBase):
    password: str = Field(..., min_length=6, max_length=128)
    institution: Optional[str] = Field(None, max_length=200)
    course: Optional[str] = Field(None, max_length=150)
    department: Optional[str] = Field(None, max_length=150)
    skills: Optional[List[str]] = Field(default_factory=list)
    interests: Optional[List[str]] = Field(default_factory=list)
    innovation_domains: Optional[List[str]] = Field(default_factory=list)

class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1, max_length=128)

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    profile: Optional[ProfileResponse] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class GoogleLoginRequest(BaseModel):
    credential: Optional[str] = None
    email: Optional[EmailStr] = None
    name: Optional[str] = None
    google_id: Optional[str] = None

class ForgotPasswordRequest(BaseModel):
    email: EmailStr
