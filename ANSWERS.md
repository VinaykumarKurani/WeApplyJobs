# ANSWERS.md

## Part 1

1.  [14:31:58–14:32:00] : There are three successful connection requests in this time interval, but the connections are increasing (45 -> 48 -> 51)
    [14:32:01] : the pool has 10 slots as pool_size = 10 and all of them are in use as active=10, and queued=23 means there are 23 more requests waiting, as pool_timeout=10s and non of these 23 got the connection pool slot within 10 seconds, prisma throws an error
    [14:32:01–14:32:02]: two requests fail at 10043ms and 10041ms which is pool_timeout=10s plus few ms of overhead. These are from those 23 queued requests which throwed error after 10 seconds
    [14:32:02] : This is a mysql database error which tells that it has reached the limit of 151 connections so because of which no new connections are accepted
    [14:32:08–14:32:09] : The requests are successful again, the connections have dropped from its peak to 34 -> 31 but the response time is still slow (4821ms, 4834ms). The connection were released by something in this interval

2.  As the pool_size=10 and queued=23 appear at same moment, this itself tells that there are 33 requests one that one instance. If we consider increasing connections (45 -> 48 -> 51), if each instance pool_size is 10 then we can assume that there are 5 instances running beacause of autoscaling

3.  The pool_timeout=10s forces the requests to get connection in 10s or throw error after 10 seconds, so connection pool timeout itself releases the queued requests as they do not keep waiting and the MySql connection limit does not allow the number to grow as it blocks the requests to its limit of 151, but its exhuastion passing and not the fix

4.  Making the connection from 10 to 100 will not solve the problem. The problem is MySql limit of 151. Suppose there are multiple instances, lets say 5, each of them with 100 limit instead of 10, the limit will exceed in two instances itself (100 + 100 = 200 and 200 > 151 (MySql limit)), it will worsen the condition instead of fixing it.

5.  Prisma Accelerate sits between the app and MySQL as a connection pooler. Instead of every Next.js instance opening its own pool directly against MySQL, all instances go through Accelerate, which maintains a small set of real connections to the database and multiplexes requests through them. The number of instances autoscaling no longer directly multiplies the connection count against MySQL. The limitation at 1,000 concurrent recruiters is that Accelerate only solves the connection-count problem — it doesn't add write throughput or fix query load on a single database.

## Part 2

1.  -- Add read replica to reduce the database load
    -- Create a different service for recruiter write with its own pool
    -- Use BullMQ for non-critical writes
    -- Add redis for read heavy paths to reduce replica load
    -- Consider further scaling if single node feels like bottleneck

2.  Keeping recruiter and user workloads together is simpler to operate — one deploy, one service to maintain. Splitting them can increase complexity but can solve different problems like connections and consistency for writes and replicas for read. If kept together and one of them spikes then the other one will be affected. My recommendation is to split them, but after the read replica and connection pooling are already in place.

3.  Jumping directly onto the sharding is not a wise option as it would simply increase the complexity. Instead we can start with creating replica, connection pooling and separate service. Consider sharding only when that level of problem occures.

4.  Inserting the application row must stay synchronous as its important to save the data into the database and then return the success response. Once the suucess response is returned, the other tasks can be taken care using the queues. BullMQ and Redis can be used to handle these operations with each of tthem having there own workers and retry with exponential backoff.

5.  First one can be that the cache still has the old data which will stay there till 5 minutes. This can be fixed by updating the key oncejob is closed. Second one can be user has the tab open with old job posting even after removal, this can be solved by short a short client-side revalidation or polling reducing window. Third one can be replica lag, if we perform read immediately after a right than that can solve the problem.
