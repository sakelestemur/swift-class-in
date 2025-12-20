import { useState } from 'react';
import { useCourseByCode, useEnrollInCourse } from '@/hooks/useCourses';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Search, BookOpen, User, Calendar, CheckCircle, Loader2 } from 'lucide-react';

export default function EnrollPage() {
  const [courseCode, setCourseCode] = useState('');
  const [searchCode, setSearchCode] = useState('');
  const { data: course, isLoading: searching } = useCourseByCode(searchCode);
  const enrollMutation = useEnrollInCourse();
  const { toast } = useToast();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (courseCode.trim()) {
      setSearchCode(courseCode.trim().toUpperCase());
    }
  };

  const handleEnroll = async () => {
    if (!course) return;
    
    try {
      await enrollMutation.mutateAsync(course.id);
      toast({
        title: 'Enrolled Successfully!',
        description: `You are now enrolled in ${course.name}`,
      });
      setCourseCode('');
      setSearchCode('');
    } catch (err: any) {
      toast({
        title: 'Enrollment Failed',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Enroll in Course</h1>
        <p className="text-muted-foreground">Enter a course code to find and enroll in a course</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Find Course
          </CardTitle>
          <CardDescription>
            Ask your teacher for the course code
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="courseCode" className="sr-only">Course Code</Label>
              <Input
                id="courseCode"
                placeholder="Enter course code (e.g., CS101)"
                value={courseCode}
                onChange={e => setCourseCode(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={!courseCode.trim() || searching}>
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {searchCode && !searching && !course && (
        <Card className="border-destructive">
          <CardContent className="flex flex-col items-center py-8">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Course Not Found</h3>
            <p className="text-muted-foreground text-center">
              No course found with code "{searchCode}". Please check the code and try again.
            </p>
          </CardContent>
        </Card>
      )}

      {course && (
        <Card className="border-primary">
          <CardHeader>
            <div className="flex items-start justify-between">
              <Badge variant="default" className="mb-2">
                {course.code}
              </Badge>
              <Badge variant="secondary" className="capitalize">
                {course.academic_term} {course.academic_year}
              </Badge>
            </div>
            <CardTitle>{course.name}</CardTitle>
            <CardDescription>
              {course.section && `Section ${course.section}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Teacher:</span>
                <span className="font-medium">{course.teacher?.full_name || 'Unknown'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Term:</span>
                <span className="font-medium capitalize">{course.academic_term} {course.academic_year}</span>
              </div>
              {course.department?.name && (
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Department:</span>
                  <span className="font-medium">{course.department.name}</span>
                </div>
              )}
            </div>

            <Button
              onClick={handleEnroll}
              disabled={enrollMutation.isPending}
              className="w-full"
              size="lg"
            >
              {enrollMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="mr-2 h-4 w-4" />
              )}
              Enroll in This Course
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
